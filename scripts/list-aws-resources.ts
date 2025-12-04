// scripts/list-aws-resources.ts
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeRouteTablesCommand } from '@aws-sdk/client-ec2';
import { fromIni } from '@aws-sdk/credential-providers';


// Configuración
const REGION = process.env.AWS_REGION || 'us-east-1';
const PROFILE = process.env.AWS_PROFILE || '442956083384_AWS-SNA-DevOps';

const client = new EC2Client({
  region: REGION,
  credentials: fromIni({ profile: PROFILE })
});

interface SecurityGroupRule {
  protocol: string;
  fromPort?: number;
  toPort?: number;
  source?: string;
  description?: string;
}

interface SecurityGroupInfo {
  groupId: string;
  groupName: string;
  description: string;
  vpcId: string;
  inboundRules: SecurityGroupRule[];
  outboundRules: SecurityGroupRule[];
  tags: { [key: string]: string };
}

interface SubnetInfo {
  subnetId: string;
  vpcId: string;
  cidrBlock: string;
  availabilityZone: string;
  availableIpAddressCount: number;
  tags: { [key: string]: string };
}

interface VpcInfo {
  vpcId: string;
  cidrBlock: string;
  isDefault: boolean;
  tags: { [key: string]: string };
}

interface RouteInfo {
  destinationCidrBlock?: string;
  destinationIpv6CidrBlock?: string;
  gatewayId?: string;
  natGatewayId?: string;
  vpcPeeringConnectionId?: string;
  transitGatewayId?: string;
  instanceId?: string;
  networkInterfaceId?: string;
  state?: string;
}

interface RouteTableInfo {
  routeTableId: string;
  vpcId: string;
  routes: RouteInfo[];
  associations: {
    subnetId?: string;
    main: boolean;
  }[];
  tags: { [key: string]: string };
}

async function listVpcs(): Promise<VpcInfo[]> {
  console.log('📡 Obteniendo VPCs...');
  const command = new DescribeVpcsCommand({});
  const response = await client.send(command);
  
  return (response.Vpcs || []).map(vpc => ({
    vpcId: vpc.VpcId || '',
    cidrBlock: vpc.CidrBlock || '',
    isDefault: vpc.IsDefault || false,
    tags: (vpc.Tags || []).reduce((acc, tag) => {
      if (tag.Key && tag.Value) acc[tag.Key] = tag.Value;
      return acc;
    }, {} as { [key: string]: string })
  }));
}

async function listSubnets(): Promise<SubnetInfo[]> {
  console.log('📡 Obteniendo Subnets...');
  const command = new DescribeSubnetsCommand({});
  const response = await client.send(command);
  
  return (response.Subnets || []).map(subnet => ({
    subnetId: subnet.SubnetId || '',
    vpcId: subnet.VpcId || '',
    cidrBlock: subnet.CidrBlock || '',
    availabilityZone: subnet.AvailabilityZone || '',
    availableIpAddressCount: subnet.AvailableIpAddressCount || 0,
    tags: (subnet.Tags || []).reduce((acc, tag) => {
      if (tag.Key && tag.Value) acc[tag.Key] = tag.Value;
      return acc;
    }, {} as { [key: string]: string })
  }));
}

async function listSecurityGroups(): Promise<SecurityGroupInfo[]> {
  console.log('📡 Obteniendo Security Groups...');
  const command = new DescribeSecurityGroupsCommand({});
  const response = await client.send(command);
  
  return (response.SecurityGroups || []).map(sg => {
    const inboundRules: SecurityGroupRule[] = (sg.IpPermissions || []).map(perm => {
      const protocol = perm.IpProtocol === '-1' ? 'All' : perm.IpProtocol || '';
      const fromPort = perm.FromPort;
      const toPort = perm.ToPort;
      
      // Obtener fuentes (IPs, grupos, etc)
      const sources: string[] = [];
      
      if (perm.IpRanges && perm.IpRanges.length > 0) {
        sources.push(...perm.IpRanges.map(ip => ip.CidrIp || ''));
      }
      
      if (perm.Ipv6Ranges && perm.Ipv6Ranges.length > 0) {
        sources.push(...perm.Ipv6Ranges.map(ip => ip.CidrIpv6 || ''));
      }
      
      if (perm.UserIdGroupPairs && perm.UserIdGroupPairs.length > 0) {
        sources.push(...perm.UserIdGroupPairs.map(pair => pair.GroupId || ''));
      }
      
      return {
        protocol,
        fromPort,
        toPort,
        source: sources.join(', ') || 'N/A',
        description: perm.IpRanges?.[0]?.Description || perm.UserIdGroupPairs?.[0]?.Description || ''
      };
    });
    
    const outboundRules: SecurityGroupRule[] = (sg.IpPermissionsEgress || []).map(perm => {
      const protocol = perm.IpProtocol === '-1' ? 'All' : perm.IpProtocol || '';
      const fromPort = perm.FromPort;
      const toPort = perm.ToPort;
      
      const destinations: string[] = [];
      
      if (perm.IpRanges && perm.IpRanges.length > 0) {
        destinations.push(...perm.IpRanges.map(ip => ip.CidrIp || ''));
      }
      
      if (perm.Ipv6Ranges && perm.Ipv6Ranges.length > 0) {
        destinations.push(...perm.Ipv6Ranges.map(ip => ip.CidrIpv6 || ''));
      }
      
      if (perm.UserIdGroupPairs && perm.UserIdGroupPairs.length > 0) {
        destinations.push(...perm.UserIdGroupPairs.map(pair => pair.GroupId || ''));
      }
      
      return {
        protocol,
        fromPort,
        toPort,
        source: destinations.join(', ') || 'N/A',
        description: perm.IpRanges?.[0]?.Description || perm.UserIdGroupPairs?.[0]?.Description || ''
      };
    });
    
    return {
      groupId: sg.GroupId || '',
      groupName: sg.GroupName || '',
      description: sg.Description || '',
      vpcId: sg.VpcId || '',
      inboundRules,
      outboundRules,
      tags: (sg.Tags || []).reduce((acc, tag) => {
        if (tag.Key && tag.Value) acc[tag.Key] = tag.Value;
        return acc;
      }, {} as { [key: string]: string })
    };
  });
}

async function listRouteTables(): Promise<RouteTableInfo[]> {
  console.log('📡 Obteniendo Route Tables...');
  try {
    const command = new DescribeRouteTablesCommand({});
    const response = await client.send(command);
    
    return (response.RouteTables || []).map(rt => {
      const routes: RouteInfo[] = (rt.Routes || []).map(route => ({
        destinationCidrBlock: route.DestinationCidrBlock,
        destinationIpv6CidrBlock: route.DestinationIpv6CidrBlock,
        gatewayId: route.GatewayId,
        natGatewayId: route.NatGatewayId,
        vpcPeeringConnectionId: route.VpcPeeringConnectionId,
        transitGatewayId: route.TransitGatewayId,
        instanceId: route.InstanceId,
        networkInterfaceId: route.NetworkInterfaceId,
        state: route.State
      }));
      
      const associations = (rt.Associations || []).map(assoc => ({
        subnetId: assoc.SubnetId,
        main: assoc.Main || false
      }));
      
      return {
        routeTableId: rt.RouteTableId || '',
        vpcId: rt.VpcId || '',
        routes,
        associations,
        tags: (rt.Tags || []).reduce((acc, tag) => {
          if (tag.Key && tag.Value) acc[tag.Key] = tag.Value;
          return acc;
        }, {} as { [key: string]: string })
      };
    });
  } catch (error: any) {
    if (error.Code === 'UnauthorizedOperation') {
      console.log('⚠️  No tienes permisos para ec2:DescribeRouteTables');
      return [];
    }
    throw error;
  }
}

function printVpcs(vpcs: VpcInfo[]) {
  console.log('\n🌐 ==================== VPCs ====================');
  vpcs.forEach((vpc, index) => {
    console.log(`\n${index + 1}. VPC ID: ${vpc.vpcId}`);
    console.log(`   CIDR Block: ${vpc.cidrBlock}`);
    console.log(`   Default: ${vpc.isDefault ? 'Yes' : 'No'}`);
    if (Object.keys(vpc.tags).length > 0) {
      console.log('   Tags:');
      Object.entries(vpc.tags).forEach(([key, value]) => {
        console.log(`     - ${key}: ${value}`);
      });
    }
  });
}

function printSubnets(subnets: SubnetInfo[]) {
  console.log('\n🔌 ==================== SUBNETS ====================');
  subnets.forEach((subnet, index) => {
    console.log(`\n${index + 1}. Subnet ID: ${subnet.subnetId}`);
    console.log(`   VPC ID: ${subnet.vpcId}`);
    console.log(`   CIDR Block: ${subnet.cidrBlock}`);
    console.log(`   Availability Zone: ${subnet.availabilityZone}`);
    console.log(`   Available IPs: ${subnet.availableIpAddressCount}`);
    if (Object.keys(subnet.tags).length > 0) {
      console.log('   Tags:');
      Object.entries(subnet.tags).forEach(([key, value]) => {
        console.log(`     - ${key}: ${value}`);
      });
    }
  });
}

function printSecurityGroups(securityGroups: SecurityGroupInfo[]) {
  console.log('\n🔒 ==================== SECURITY GROUPS ====================');
  securityGroups.forEach((sg, index) => {
    console.log(`\n${index + 1}. Security Group ID: ${sg.groupId}`);
    console.log(`   Name: ${sg.groupName}`);
    console.log(`   Description: ${sg.description}`);
    console.log(`   VPC ID: ${sg.vpcId}`);
    
    if (Object.keys(sg.tags).length > 0) {
      console.log('   Tags:');
      Object.entries(sg.tags).forEach(([key, value]) => {
        console.log(`     - ${key}: ${value}`);
      });
    }
    
    console.log('\n   📥 INBOUND RULES:');
    if (sg.inboundRules.length === 0) {
      console.log('     ⚠️  No inbound rules');
    } else {
      sg.inboundRules.forEach((rule, ruleIndex) => {
        const portRange = rule.fromPort && rule.toPort 
          ? `Port ${rule.fromPort}${rule.fromPort !== rule.toPort ? `-${rule.toPort}` : ''}`
          : 'All ports';
        console.log(`     ${ruleIndex + 1}. Protocol: ${rule.protocol} | ${portRange}`);
        console.log(`        Source: ${rule.source}`);
        if (rule.description) {
          console.log(`        Description: ${rule.description}`);
        }
      });
    }
    
    console.log('\n   📤 OUTBOUND RULES:');
    if (sg.outboundRules.length === 0) {
      console.log('     ⚠️  No outbound rules');
    } else {
      sg.outboundRules.forEach((rule, ruleIndex) => {
        const portRange = rule.fromPort && rule.toPort 
          ? `Port ${rule.fromPort}${rule.fromPort !== rule.toPort ? `-${rule.toPort}` : ''}`
          : 'All ports';
        console.log(`     ${ruleIndex + 1}. Protocol: ${rule.protocol} | ${portRange}`);
        console.log(`        Destination: ${rule.source}`);
        if (rule.description) {
          console.log(`        Description: ${rule.description}`);
        }
      });
    }
  });
}

function printRouteTables(routeTables: RouteTableInfo[]) {
  console.log('\n🛣️  ==================== ROUTE TABLES ====================');
  routeTables.forEach((rt, index) => {
    console.log(`\n${index + 1}. Route Table ID: ${rt.routeTableId}`);
    console.log(`   VPC ID: ${rt.vpcId}`);
    
    if (Object.keys(rt.tags).length > 0) {
      console.log('   Tags:');
      Object.entries(rt.tags).forEach(([key, value]) => {
        console.log(`     - ${key}: ${value}`);
      });
    }
    
    console.log('\n   🗺️  ROUTES:');
    if (rt.routes.length === 0) {
      console.log('     ⚠️  No routes');
    } else {
      rt.routes.forEach((route, routeIndex) => {
        const destination = route.destinationCidrBlock || route.destinationIpv6CidrBlock || 'N/A';
        const target = route.gatewayId || route.natGatewayId || route.vpcPeeringConnectionId || 
                      route.transitGatewayId || route.instanceId || route.networkInterfaceId || 'N/A';
        const state = route.state || 'unknown';
        
        console.log(`     ${routeIndex + 1}. Destination: ${destination}`);
        console.log(`        Target: ${target}`);
        console.log(`        State: ${state}`);
      });
    }
    
    console.log('\n   🔗 ASSOCIATIONS:');
    if (rt.associations.length === 0) {
      console.log('     ⚠️  No associations');
    } else {
      rt.associations.forEach((assoc, assocIndex) => {
        if (assoc.main) {
          console.log(`     ${assocIndex + 1}. Main route table (applies to all subnets without explicit association)`);
        } else if (assoc.subnetId) {
          console.log(`     ${assocIndex + 1}. Subnet: ${assoc.subnetId}`);
        }
      });
    }
  });
}

async function main() {
  try {
    console.log('🚀 Listando recursos de AWS...');
    console.log(`📍 Región: ${REGION}`);
    console.log(`👤 Perfil: ${PROFILE}\n`);
    
    // Obtener todos los recursos
    const [vpcs, subnets, securityGroups, routeTables] = await Promise.all([
      listVpcs(),
      listSubnets(),
      listSecurityGroups(),
      listRouteTables()
    ]);
    
    // Imprimir en consola
    printVpcs(vpcs);
    printSubnets(subnets);
    printSecurityGroups(securityGroups);
    //printRouteTables(routeTables);
    
    console.log(`\n📊 Resumen:`);
    console.log(`   - VPCs: ${vpcs.length}`);
    console.log(`   - Subnets: ${subnets.length}`);
    console.log(`   - Security Groups: ${securityGroups.length}`);
    console.log(`   - Route Tables: ${routeTables.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();