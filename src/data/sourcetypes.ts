export interface Sourcetype {
  id: string
  name: string
  category: SourceCategory
  color: string
  techniqueIds: string[]
}

export type SourceCategory =
  | 'endpoint'
  | 'edr'
  | 'network'
  | 'identity'
  | 'cloud'
  | 'email'
  | 'application'

export const categoryColors: Record<SourceCategory, string> = {
  endpoint: '#3b82f6',
  edr: '#dc2626',
  network: '#10b981',
  identity: '#f59e0b',
  cloud: '#8b5cf6',
  email: '#ec4899',
  application: '#06b6d4',
}

export const categoryLabels: Record<SourceCategory, string> = {
  endpoint: 'Endpoint',
  edr: 'EDR',
  network: 'Network',
  identity: 'Identity & Access',
  cloud: 'Cloud',
  email: 'Email',
  application: 'Application',
}

export const sourcetypes: Sourcetype[] = [
  // ── Endpoint ──
  {
    id: 'win-security',
    name: 'Windows Security Event Log',
    category: 'endpoint',
    color: '#3b82f6',
    techniqueIds: [
      'T1078', 'T1059', 'T1053', 'T1547', 'T1037', 'T1543', 'T1546',
      'T1136', 'T1098', 'T1134', 'T1548', 'T1055', 'T1070', 'T1112',
      'T1562', 'T1003', 'T1110', 'T1556', 'T1087', 'T1069', 'T1033',
      'T1007', 'T1021', 'T1563', 'T1531', 'T1489', 'T1484', 'T1222',
      'T1574', 'T1569', 'T1012', 'T1018', 'T1049', 'T1057',
    ],
  },
  {
    id: 'sysmon',
    name: 'Sysmon',
    category: 'endpoint',
    color: '#60a5fa',
    techniqueIds: [
      'T1059', 'T1106', 'T1129', 'T1053', 'T1547', 'T1543', 'T1546',
      'T1574', 'T1055', 'T1036', 'T1027', 'T1218', 'T1127', 'T1140',
      'T1202', 'T1564', 'T1070', 'T1112', 'T1562', 'T1003', 'T1056',
      'T1083', 'T1057', 'T1012', 'T1082', 'T1016', 'T1049', 'T1518',
      'T1007', 'T1105', 'T1071', 'T1572', 'T1571', 'T1095', 'T1021',
      'T1570', 'T1197', 'T1569', 'T1204', 'T1047', 'T1497', 'T1014',
      'T1542', 'T1220', 'T1221', 'T1559',
    ],
  },
  {
    id: 'edr-crowdstrike',
    name: 'CrowdStrike Falcon',
    category: 'edr',
    color: '#e63946',
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
    category: 'endpoint',
    color: '#93c5fd',
    techniqueIds: [
      'T1059', 'T1106', 'T1204', 'T1027', 'T1140', 'T1218', 'T1216',
      'T1220', 'T1202', 'T1082', 'T1016', 'T1033', 'T1087', 'T1069',
      'T1018', 'T1083', 'T1518', 'T1105', 'T1560', 'T1005',
    ],
  },
  {
    id: 'linux-auditd',
    name: 'Linux Auditd',
    category: 'endpoint',
    color: '#1d4ed8',
    techniqueIds: [
      'T1059', 'T1053', 'T1547', 'T1543', 'T1546', 'T1037', 'T1574',
      'T1548', 'T1222', 'T1055', 'T1070', 'T1564', 'T1036', 'T1003',
      'T1552', 'T1087', 'T1057', 'T1082', 'T1083', 'T1016', 'T1049',
      'T1021', 'T1005', 'T1078', 'T1136', 'T1098',
    ],
  },
  {
    id: 'macos-unified',
    name: 'macOS Unified Logs',
    category: 'endpoint',
    color: '#1e40af',
    techniqueIds: [
      'T1059', 'T1053', 'T1547', 'T1543', 'T1548', 'T1222', 'T1070',
      'T1564', 'T1036', 'T1562', 'T1087', 'T1057', 'T1082', 'T1083',
      'T1016', 'T1021', 'T1005', 'T1078', 'T1176',
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
]
