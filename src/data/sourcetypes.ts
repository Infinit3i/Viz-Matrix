export interface Sourcetype {
  id: string
  name: string
  category: SourceCategory
  color: string
  techniqueIds: string[]
  /** Which OS platforms this source supports. Omit for platform-agnostic sources. */
  platforms?: ('windows' | 'linux' | 'macos')[]
}

export type SourceCategory =
  | 'windows'
  | 'linux'
  | 'macos'
  | 'edr'
  | 'network'
  | 'identity'
  | 'cloud'
  | 'email'
  | 'application'
  | 'cicd'
  | 'saas'

export const categoryColors: Record<SourceCategory, string> = {
  windows: '#3b82f6',
  linux: '#f97316',
  macos: '#a3a3a3',
  edr: '#dc2626',
  network: '#10b981',
  identity: '#f59e0b',
  cloud: '#8b5cf6',
  email: '#ec4899',
  application: '#06b6d4',
  cicd: '#f97316',
  saas: '#a855f7',
}

export const categoryLabels: Record<SourceCategory, string> = {
  windows: 'Windows',
  linux: 'Linux',
  macos: 'macOS',
  edr: 'EDR',
  network: 'Network',
  identity: 'Identity & Access',
  cloud: 'Cloud',
  email: 'Email',
  application: 'Application',
  cicd: 'CI/CD',
  saas: 'SaaS',
}

export const sourcetypes: Sourcetype[] = [
  // ── Windows ──
  {
    id: 'win-security',
    name: 'Security Event Log',
    category: 'windows',
    color: '#3b82f6',
    techniqueIds: [
      'T1078', 'T1078.001', 'T1078.002', 'T1078.003',
      'T1059', 'T1053', 'T1053.005', 'T1547', 'T1547.001', 'T1037', 'T1037.001',
      'T1543', 'T1543.003', 'T1546', 'T1136', 'T1136.001', 'T1136.002',
      'T1098', 'T1134', 'T1134.001', 'T1134.002', 'T1548', 'T1548.002',
      'T1055', 'T1070', 'T1070.001', 'T1112', 'T1562', 'T1562.001', 'T1562.002',
      'T1003', 'T1110', 'T1110.001', 'T1110.003', 'T1556', 'T1087', 'T1087.001', 'T1087.002',
      'T1069', 'T1069.001', 'T1069.002', 'T1033', 'T1007', 'T1021', 'T1021.001', 'T1021.002',
      'T1563', 'T1531', 'T1489', 'T1484', 'T1222', 'T1222.001',
      'T1574', 'T1569', 'T1569.002', 'T1012', 'T1018', 'T1049', 'T1057',
    ],
  },
  {
    id: 'win-system',
    name: 'System Event Log',
    category: 'windows',
    color: '#2563eb',
    techniqueIds: [
      'T1543', 'T1543.003', 'T1569', 'T1569.002',
      'T1489', 'T1529', 'T1490', 'T1547', 'T1547.001',
      'T1562', 'T1562.001', 'T1562.004',
      'T1007', 'T1082',
    ],
  },
  {
    id: 'win-application',
    name: 'Application Event Log',
    category: 'windows',
    color: '#1d4ed8',
    techniqueIds: [
      'T1203', 'T1059', 'T1059.005', 'T1059.007',
      'T1190', 'T1210', 'T1499', 'T1499.004',
      'T1137', 'T1137.001', 'T1137.006',
    ],
  },
  {
    id: 'sysmon',
    name: 'Sysmon',
    category: 'windows',
    color: '#60a5fa',
    techniqueIds: [
      'T1059', 'T1059.001', 'T1059.003', 'T1059.005', 'T1059.007',
      'T1106', 'T1129', 'T1053', 'T1053.005',
      'T1547', 'T1547.001', 'T1547.004', 'T1547.009', 'T1547.010', 'T1547.012', 'T1547.014',
      'T1543', 'T1543.003', 'T1546', 'T1546.001', 'T1546.003', 'T1546.007', 'T1546.008',
      'T1546.009', 'T1546.010', 'T1546.011', 'T1546.012', 'T1546.015',
      'T1574', 'T1574.001', 'T1574.008', 'T1574.009', 'T1574.010', 'T1574.011', 'T1574.012',
      'T1055', 'T1055.001', 'T1055.002', 'T1055.003', 'T1055.012',
      'T1036', 'T1036.003', 'T1036.005', 'T1036.007',
      'T1027', 'T1218', 'T1218.001', 'T1218.003', 'T1218.004', 'T1218.005', 'T1218.007',
      'T1218.009', 'T1218.010', 'T1218.011', 'T1218.012', 'T1218.014',
      'T1127', 'T1127.001', 'T1140', 'T1202', 'T1564', 'T1564.001', 'T1564.004',
      'T1070', 'T1070.004', 'T1070.006', 'T1112', 'T1562', 'T1003', 'T1056', 'T1056.001',
      'T1083', 'T1057', 'T1012', 'T1082', 'T1016', 'T1049', 'T1518', 'T1518.001',
      'T1007', 'T1105', 'T1071', 'T1572', 'T1571', 'T1095', 'T1021',
      'T1570', 'T1197', 'T1569', 'T1204', 'T1204.002', 'T1047', 'T1497', 'T1014',
      'T1542', 'T1220', 'T1221', 'T1559', 'T1559.001', 'T1559.002',
    ],
  },
  {
    id: 'edr-crowdstrike',
    name: 'CrowdStrike Falcon',
    category: 'edr',
    color: '#e63946',
    platforms: ['windows', 'linux', 'macos'],
    techniqueIds: [
      'T1059', 'T1106', 'T1053', 'T1204', 'T1547', 'T1543', 'T1546',
      'T1574', 'T1037', 'T1055', 'T1134', 'T1548', 'T1036', 'T1027',
      'T1218', 'T1562', 'T1070', 'T1564', 'T1140', 'T1003', 'T1555',
      'T1056', 'T1552', 'T1083', 'T1057', 'T1082', 'T1518',
      'T1021', 'T1570', 'T1105', 'T1560', 'T1005', 'T1113', 'T1486',
      'T1485', 'T1489', 'T1490', 'T1529', 'T1561', 'T1496', 'T1197',
      'T1569', 'T1047', 'T1497', 'T1068', 'T1014', 'T1129',
      'T1071', 'T1095', 'T1571', 'T1572', 'T1573',
    ],
  },
  {
    id: 'edr-defender',
    name: 'Microsoft Defender for Endpoint',
    category: 'edr',
    color: '#2563eb',
    platforms: ['windows'],
    techniqueIds: [
      'T1059', 'T1106', 'T1053', 'T1204', 'T1547', 'T1543', 'T1546',
      'T1574', 'T1037', 'T1055', 'T1134', 'T1548', 'T1036', 'T1027',
      'T1218', 'T1562', 'T1070', 'T1564', 'T1140', 'T1003', 'T1555',
      'T1056', 'T1539', 'T1552', 'T1083', 'T1057', 'T1082', 'T1518',
      'T1021', 'T1570', 'T1105', 'T1005', 'T1486',
      'T1485', 'T1489', 'T1490', 'T1529', 'T1561', 'T1197',
      'T1569', 'T1047', 'T1497', 'T1068', 'T1014', 'T1542',
      'T1112', 'T1012', 'T1016', 'T1033', 'T1049', 'T1220', 'T1221',
      'T1176', 'T1554', 'T1559',
    ],
  },
  {
    id: 'edr-sentinelone',
    name: 'SentinelOne',
    category: 'edr',
    color: '#7c3aed',
    platforms: ['windows', 'linux', 'macos'],
    techniqueIds: [
      'T1059', 'T1106', 'T1053', 'T1204', 'T1547', 'T1543', 'T1546',
      'T1574', 'T1055', 'T1134', 'T1548', 'T1036', 'T1027',
      'T1218', 'T1562', 'T1070', 'T1564', 'T1140', 'T1003', 'T1555',
      'T1056', 'T1552', 'T1083', 'T1057', 'T1082', 'T1518',
      'T1021', 'T1570', 'T1105', 'T1560', 'T1005', 'T1113', 'T1486',
      'T1485', 'T1489', 'T1490', 'T1529', 'T1561', 'T1496',
      'T1569', 'T1047', 'T1497', 'T1068', 'T1611', 'T1014',
      'T1609', 'T1610', 'T1129', 'T1525',
    ],
  },
  {
    id: 'edr-carbonblack',
    name: 'VMware Carbon Black',
    category: 'edr',
    color: '#059669',
    platforms: ['windows', 'linux'],
    techniqueIds: [
      'T1059', 'T1106', 'T1053', 'T1204', 'T1547', 'T1543', 'T1546',
      'T1574', 'T1055', 'T1036', 'T1027', 'T1218', 'T1562',
      'T1070', 'T1564', 'T1140', 'T1003', 'T1083', 'T1057', 'T1082',
      'T1518', 'T1021', 'T1105', 'T1005', 'T1486', 'T1485',
      'T1489', 'T1490', 'T1569', 'T1047', 'T1497', 'T1068',
      'T1197', 'T1129', 'T1112', 'T1016', 'T1049',
    ],
  },
  {
    id: 'edr-cortex',
    name: 'Palo Alto Cortex XDR',
    category: 'edr',
    color: '#ea580c',
    platforms: ['windows', 'linux', 'macos'],
    techniqueIds: [
      'T1059', 'T1106', 'T1053', 'T1204', 'T1547', 'T1543', 'T1546',
      'T1574', 'T1037', 'T1055', 'T1134', 'T1548', 'T1036', 'T1027',
      'T1218', 'T1562', 'T1070', 'T1564', 'T1140', 'T1003', 'T1555',
      'T1552', 'T1083', 'T1057', 'T1082', 'T1518',
      'T1021', 'T1570', 'T1105', 'T1560', 'T1005', 'T1486',
      'T1485', 'T1489', 'T1490', 'T1529', 'T1561', 'T1496',
      'T1569', 'T1047', 'T1497', 'T1068', 'T1014',
      'T1071', 'T1095', 'T1571', 'T1572',
      'T1046', 'T1040',
    ],
  },
  {
    id: 'win-powershell',
    name: 'PowerShell Logging',
    category: 'windows',
    color: '#93c5fd',
    techniqueIds: [
      'T1059', 'T1059.001', 'T1106', 'T1204', 'T1204.002',
      'T1027', 'T1027.010', 'T1140', 'T1218', 'T1216', 'T1216.001',
      'T1220', 'T1202', 'T1082', 'T1016', 'T1033', 'T1087', 'T1087.001', 'T1087.002',
      'T1069', 'T1069.001', 'T1069.002',
      'T1018', 'T1083', 'T1518', 'T1518.001', 'T1105', 'T1560', 'T1005',
    ],
  },
  {
    id: 'win-cmdline',
    name: 'Command Line Logging',
    category: 'windows',
    color: '#7dd3fc',
    techniqueIds: [
      'T1059', 'T1059.001', 'T1059.003', 'T1059.005', 'T1059.007',
      'T1204', 'T1204.002', 'T1027', 'T1027.010', 'T1140',
      'T1218', 'T1218.005', 'T1218.010', 'T1218.011',
      'T1202', 'T1216', 'T1220', 'T1047',
      'T1082', 'T1016', 'T1033', 'T1018', 'T1083', 'T1057',
      'T1105', 'T1560',
    ],
  },
  {
    id: 'win-defender',
    name: 'Windows Defender Logs',
    category: 'windows',
    color: '#38bdf8',
    techniqueIds: [
      'T1059', 'T1204', 'T1204.002', 'T1027', 'T1027.002',
      'T1036', 'T1036.005', 'T1562', 'T1562.001',
      'T1218', 'T1055', 'T1014',
      'T1486', 'T1485', 'T1105',
      'T1203', 'T1190',
    ],
  },
  {
    id: 'win-wmi',
    name: 'WMI Activity Logs',
    category: 'windows',
    color: '#bfdbfe',
    techniqueIds: [
      'T1047', 'T1546.003', 'T1059', 'T1082', 'T1018', 'T1057',
      'T1021', 'T1021.003',
    ],
  },

  // ── Linux ──
  {
    id: 'linux-auditd',
    name: 'Linux Auditd',
    category: 'linux',
    color: '#ea580c',
    techniqueIds: [
      'T1059', 'T1059.004', 'T1053', 'T1053.003', 'T1053.006',
      'T1547', 'T1547.006', 'T1547.013', 'T1543', 'T1543.002',
      'T1546', 'T1546.004', 'T1546.005', 'T1546.017',
      'T1037', 'T1037.004', 'T1574', 'T1574.006',
      'T1548', 'T1548.001', 'T1548.003', 'T1222', 'T1222.002',
      'T1055', 'T1055.008', 'T1055.009',
      'T1070', 'T1070.002', 'T1070.003', 'T1070.004',
      'T1564', 'T1564.001', 'T1036', 'T1003', 'T1003.007', 'T1003.008',
      'T1552', 'T1552.001', 'T1552.003', 'T1552.004',
      'T1087', 'T1057', 'T1082', 'T1083', 'T1016', 'T1049',
      'T1021', 'T1021.004', 'T1005', 'T1078', 'T1078.003', 'T1136', 'T1098',
    ],
  },
  {
    id: 'linux-sysmon',
    name: 'Sysmon for Linux',
    category: 'linux',
    color: '#f97316',
    techniqueIds: [
      'T1059', 'T1059.004', 'T1059.006', 'T1106',
      'T1053', 'T1053.003', 'T1053.006',
      'T1547', 'T1547.006', 'T1543', 'T1543.002',
      'T1546', 'T1546.004', 'T1546.005', 'T1546.017',
      'T1574', 'T1574.006', 'T1055', 'T1055.008', 'T1055.009',
      'T1036', 'T1027', 'T1140', 'T1564', 'T1564.001',
      'T1070', 'T1070.002', 'T1070.004',
      'T1003', 'T1003.007', 'T1003.008', 'T1056',
      'T1083', 'T1057', 'T1082', 'T1016', 'T1049',
      'T1105', 'T1071', 'T1095', 'T1571', 'T1572',
      'T1021', 'T1021.004', 'T1570',
      'T1497', 'T1014', 'T1204',
    ],
  },
  {
    id: 'linux-journald',
    name: 'Journald / Syslog',
    category: 'linux',
    color: '#fb923c',
    techniqueIds: [
      'T1059', 'T1059.004', 'T1078', 'T1078.003',
      'T1136', 'T1098', 'T1110',
      'T1053', 'T1053.003', 'T1543', 'T1543.002',
      'T1562', 'T1562.012', 'T1070', 'T1070.002',
      'T1087', 'T1082', 'T1007', 'T1021', 'T1021.004',
      'T1489', 'T1529',
    ],
  },

  // ── macOS ──
  {
    id: 'macos-unified',
    name: 'macOS Unified Logs',
    category: 'macos',
    color: '#a3a3a3',
    techniqueIds: [
      'T1059', 'T1059.002', 'T1059.004',
      'T1053', 'T1547', 'T1547.007', 'T1547.015',
      'T1543', 'T1543.001', 'T1543.004',
      'T1548', 'T1548.004', 'T1222', 'T1222.002',
      'T1070', 'T1564', 'T1564.001', 'T1564.009',
      'T1036', 'T1562', 'T1087', 'T1057', 'T1082', 'T1083',
      'T1016', 'T1021', 'T1005', 'T1078', 'T1078.003',
      'T1176', 'T1176.001',
    ],
  },
  {
    id: 'macos-esf',
    name: 'macOS Endpoint Security Framework',
    category: 'macos',
    color: '#d4d4d4',
    techniqueIds: [
      'T1059', 'T1059.002', 'T1059.004', 'T1059.007',
      'T1106', 'T1055', 'T1547', 'T1543', 'T1546',
      'T1548', 'T1548.004', 'T1548.006',
      'T1574', 'T1574.004', 'T1574.006',
      'T1036', 'T1027', 'T1564', 'T1070', 'T1070.004',
      'T1553', 'T1553.001',
      'T1003', 'T1056', 'T1555', 'T1555.001',
      'T1083', 'T1057', 'T1082', 'T1005',
      'T1105', 'T1021', 'T1570',
      'T1204', 'T1497',
    ],
  },

  // ── Network ──
  {
    id: 'firewall',
    name: 'Firewall Logs',
    category: 'network',
    color: '#10b981',
    techniqueIds: [
      'T1190', 'T1133', 'T1071', 'T1095', 'T1571', 'T1572', 'T1090',
      'T1008', 'T1105', 'T1048', 'T1041', 'T1568', 'T1573', 'T1046',
      'T1498', 'T1499', 'T1205', 'T1021', 'T1018', 'T1049',
    ],
  },
  {
    id: 'ids-ips',
    name: 'IDS/IPS (Snort / Suricata)',
    category: 'network',
    color: '#34d399',
    techniqueIds: [
      'T1190', 'T1189', 'T1210', 'T1071', 'T1095', 'T1571', 'T1572',
      'T1573', 'T1001', 'T1132', 'T1568', 'T1105', 'T1048', 'T1041',
      'T1595', 'T1046', 'T1498', 'T1499', 'T1557',
    ],
  },
  {
    id: 'dns',
    name: 'DNS Logs',
    category: 'network',
    color: '#6ee7b7',
    techniqueIds: [
      'T1071', 'T1568', 'T1572', 'T1090', 'T1102', 'T1583', 'T1584',
      'T1189', 'T1566', 'T1598', 'T1048', 'T1001', 'T1046',
    ],
  },
  {
    id: 'proxy',
    name: 'Web Proxy / CASB',
    category: 'network',
    color: '#059669',
    techniqueIds: [
      'T1071', 'T1102', 'T1090', 'T1572', 'T1573', 'T1132', 'T1001',
      'T1105', 'T1189', 'T1566', 'T1567', 'T1048', 'T1041', 'T1530',
      'T1219', 'T1568',
    ],
  },
  {
    id: 'netflow',
    name: 'NetFlow / IPFIX',
    category: 'network',
    color: '#047857',
    techniqueIds: [
      'T1071', 'T1095', 'T1571', 'T1572', 'T1048', 'T1041', 'T1046',
      'T1040', 'T1049', 'T1018', 'T1498', 'T1030', 'T1008', 'T1104',
    ],
  },
  {
    id: 'zeek',
    name: 'Zeek (Bro)',
    category: 'network',
    color: '#047857',
    techniqueIds: [
      'T1071', 'T1071.001', 'T1071.002', 'T1071.003', 'T1071.004',
      'T1095', 'T1571', 'T1572', 'T1573', 'T1001', 'T1132',
      'T1568', 'T1568.001', 'T1568.002',
      'T1105', 'T1104', 'T1008',
      'T1040', 'T1557', 'T1557.001', 'T1557.002',
      'T1048', 'T1041', 'T1030',
      'T1190', 'T1189', 'T1210',
      'T1046', 'T1018', 'T1049',
      'T1021', 'T1021.001', 'T1021.002',
      'T1570', 'T1219',
      'T1090', 'T1102',
      'T1498', 'T1499',
      'T1205', 'T1659',
    ],
  },
  {
    id: 'pcap',
    name: 'Full Packet Capture',
    category: 'network',
    color: '#065f46',
    techniqueIds: [
      'T1071', 'T1095', 'T1571', 'T1572', 'T1573', 'T1001', 'T1132',
      'T1040', 'T1557', 'T1048', 'T1041', 'T1105', 'T1210', 'T1190',
      'T1189', 'T1498', 'T1021', 'T1570',
    ],
  },

  // ── Identity ──
  {
    id: 'ad-logs',
    name: 'Active Directory / LDAP',
    category: 'identity',
    color: '#f59e0b',
    techniqueIds: [
      'T1078', 'T1136', 'T1098', 'T1484', 'T1087', 'T1069', 'T1482',
      'T1033', 'T1018', 'T1201', 'T1110', 'T1558', 'T1556', 'T1187',
      'T1207', 'T1531',
    ],
  },
  {
    id: 'azure-ad',
    name: 'Azure AD / Entra ID',
    category: 'identity',
    color: '#fbbf24',
    techniqueIds: [
      'T1078', 'T1136', 'T1098', 'T1484', 'T1087', 'T1069', 'T1110',
      'T1556', 'T1606', 'T1528', 'T1621', 'T1531', 'T1538', 'T1526',
    ],
  },
  {
    id: 'vpn',
    name: 'VPN Logs',
    category: 'identity',
    color: '#d97706',
    techniqueIds: [
      'T1078', 'T1133', 'T1021', 'T1110', 'T1090', 'T1573',
    ],
  },
  {
    id: 'mfa',
    name: 'MFA / Auth Logs',
    category: 'identity',
    color: '#b45309',
    techniqueIds: [
      'T1078', 'T1110', 'T1556', 'T1111', 'T1621', 'T1550',
    ],
  },

  // ── Cloud ──
  {
    id: 'aws-cloudtrail',
    name: 'AWS CloudTrail',
    category: 'cloud',
    color: '#8b5cf6',
    techniqueIds: [
      'T1078', 'T1136', 'T1098', 'T1580', 'T1538', 'T1526', 'T1535',
      'T1562', 'T1070', 'T1530', 'T1537', 'T1567', 'T1190', 'T1110',
      'T1528', 'T1484', 'T1525', 'T1496', 'T1613', 'T1552',
    ],
  },
  {
    id: 'azure-activity',
    name: 'Azure Activity Log',
    category: 'cloud',
    color: '#a78bfa',
    techniqueIds: [
      'T1078', 'T1136', 'T1098', 'T1580', 'T1538', 'T1526', 'T1535',
      'T1562', 'T1530', 'T1537', 'T1190', 'T1528', 'T1484', 'T1496',
      'T1613',
    ],
  },
  {
    id: 'gcp-audit',
    name: 'GCP Audit Logs',
    category: 'cloud',
    color: '#7c3aed',
    techniqueIds: [
      'T1078', 'T1136', 'T1098', 'T1580', 'T1526', 'T1535', 'T1562',
      'T1530', 'T1537', 'T1190', 'T1528', 'T1496', 'T1613',
    ],
  },

  // ── Email ──
  {
    id: 'email-gateway',
    name: 'Email Gateway / O365 Message Trace',
    category: 'email',
    color: '#ec4899',
    techniqueIds: [
      'T1566', 'T1598', 'T1534', 'T1114', 'T1586', 'T1585', 'T1204',
    ],
  },
  {
    id: 'email-dlp',
    name: 'Email DLP',
    category: 'email',
    color: '#f472b6',
    techniqueIds: [
      'T1048', 'T1567', 'T1114', 'T1030', 'T1020',
    ],
  },

  // ── Application ──
  {
    id: 'waf',
    name: 'WAF Logs',
    category: 'application',
    color: '#06b6d4',
    techniqueIds: [
      'T1190', 'T1189', 'T1505', 'T1059', 'T1210', 'T1071', 'T1499',
      'T1595',
    ],
  },
  {
    id: 'database-audit',
    name: 'Database Audit Logs',
    category: 'application',
    color: '#22d3ee',
    techniqueIds: [
      'T1213', 'T1005', 'T1565', 'T1485', 'T1190', 'T1078', 'T1552',
    ],
  },
  {
    id: 'container-logs',
    name: 'Container Runtime (K8s Audit)',
    category: 'application',
    color: '#0891b2',
    techniqueIds: [
      'T1609', 'T1610', 'T1611', 'T1613', 'T1525', 'T1078', 'T1053',
      'T1543', 'T1496', 'T1562',
    ],
  },

  // ── CI/CD ──
  {
    id: 'github-audit',
    name: 'GitHub Audit Log',
    category: 'cicd',
    color: '#f97316',
    techniqueIds: [
      'T1078', 'T1098', 'T1136', 'T1195', 'T1195.001', 'T1195.002',
      'T1199', 'T1552', 'T1552.001', 'T1552.004', 'T1070', 'T1070.004',
      'T1059', 'T1072', 'T1525', 'T1677', 'T1528',
    ],
  },
  {
    id: 'gitlab-audit',
    name: 'GitLab Audit Events',
    category: 'cicd',
    color: '#ea580c',
    techniqueIds: [
      'T1078', 'T1098', 'T1136', 'T1195', 'T1195.001', 'T1195.002',
      'T1199', 'T1552', 'T1552.001', 'T1552.004', 'T1070', 'T1070.004',
      'T1059', 'T1072', 'T1525', 'T1677', 'T1528',
    ],
  },
  {
    id: 'jenkins-logs',
    name: 'Jenkins Audit / Build Logs',
    category: 'cicd',
    color: '#c2410c',
    techniqueIds: [
      'T1059', 'T1059.001', 'T1059.003', 'T1059.004', 'T1059.006',
      'T1078', 'T1552', 'T1552.001', 'T1195', 'T1195.001',
      'T1072', 'T1525', 'T1677', 'T1204', 'T1053',
    ],
  },
  {
    id: 'container-registry',
    name: 'Container Registry Logs',
    category: 'cicd',
    color: '#9a3412',
    techniqueIds: [
      'T1525', 'T1610', 'T1195', 'T1195.002', 'T1078',
      'T1098', 'T1072', 'T1204.003',
    ],
  },

  // ── SaaS ──
  {
    id: 'o365-unified',
    name: 'Microsoft 365 Unified Audit',
    category: 'saas',
    color: '#a855f7',
    techniqueIds: [
      'T1078', 'T1078.004', 'T1098', 'T1098.002', 'T1098.003',
      'T1136', 'T1136.003', 'T1110', 'T1110.003', 'T1110.004',
      'T1556', 'T1556.006', 'T1621', 'T1528', 'T1539',
      'T1114', 'T1114.002', 'T1114.003', 'T1213', 'T1213.002',
      'T1530', 'T1567', 'T1567.002', 'T1048',
      'T1087', 'T1087.004', 'T1069', 'T1069.003',
      'T1538', 'T1526', 'T1484', 'T1531',
      'T1564.008', 'T1534', 'T1204', 'T1204.001',
    ],
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace Audit',
    category: 'saas',
    color: '#9333ea',
    techniqueIds: [
      'T1078', 'T1078.004', 'T1098', 'T1136', 'T1136.003',
      'T1110', 'T1110.003', 'T1528', 'T1539', 'T1621',
      'T1114', 'T1114.003', 'T1213', 'T1530',
      'T1567', 'T1567.002', 'T1048',
      'T1087', 'T1087.004', 'T1069', 'T1526',
      'T1531', 'T1534', 'T1204', 'T1204.001',
    ],
  },
  {
    id: 'slack-audit',
    name: 'Slack Audit Logs',
    category: 'saas',
    color: '#7c3aed',
    techniqueIds: [
      'T1078', 'T1098', 'T1136', 'T1528', 'T1539',
      'T1213', 'T1213.005', 'T1534', 'T1567',
      'T1087', 'T1531', 'T1204', 'T1204.001',
      'T1552', 'T1552.008',
    ],
  },
  {
    id: 'zoom-logs',
    name: 'Zoom Admin Logs',
    category: 'saas',
    color: '#6d28d9',
    techniqueIds: [
      'T1078', 'T1098', 'T1136', 'T1528',
      'T1123', 'T1125', 'T1113',
      'T1087', 'T1531',
    ],
  },
  {
    id: 'salesforce-audit',
    name: 'Salesforce Event Log',
    category: 'saas',
    color: '#5b21b6',
    techniqueIds: [
      'T1078', 'T1098', 'T1136', 'T1110', 'T1528',
      'T1213', 'T1213.004', 'T1005', 'T1530',
      'T1567', 'T1048', 'T1087', 'T1531',
      'T1565', 'T1565.001',
    ],
  },
  {
    id: 'servicenow-audit',
    name: 'ServiceNow Audit',
    category: 'saas',
    color: '#4c1d95',
    techniqueIds: [
      'T1078', 'T1098', 'T1136', 'T1110', 'T1528',
      'T1213', 'T1005', 'T1087', 'T1531',
      'T1565', 'T1565.001',
    ],
  },
]
