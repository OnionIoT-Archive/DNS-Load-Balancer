'use strict';

module.exports.ns_packsiz = 512;		// Default UDP Packet size
module.exports.ns_maxdname = 1025;		// Maximum domain name
module.exports.ns_maxmsg = 65535;		// Maximum message size
module.exports.ns_maxcdname = 255;		// Maximum compressed domain name
module.exports.ns_maxlabel = 63;		// Maximum compressed domain label
module.exports.ns_hfixedsz = 12;		// Bytes of fixed data in header
module.exports.ns_qfixedsz = 4;         // Bytes of fixed data in query
module.exports.ns_rrfixedsz = 10;		// Bytes of fixed data in r record
module.exports.ns_int32sz = 4;			// Bytes of data in a u_int32_t
module.exports.ns_int16sz = 2;			// Bytes of data in a u_int16_t
module.exports.ns_int8sz = 1;			// Bytes of data in a u_int8_t
module.exports.ns_inaddrsz = 4;         // IPv4 T_A
module.exports.ns_in6addrsz = 16;		// IPv6 T_AAAA
module.exports.ns_cmprsflgs = 0xc0;     // Flag bits indicating name compression.
module.exports.ns_defaultport = 53;     // For both UDP and TCP.

module.exports.ns_sect = {
    'ns_s_qd': 0,			// Query: Question.
    'ns_s_zn': 0,			// Update: Zone.
    'ns_s_an': 1,			// Query: Answer.
    'ns_s_pr': 1,			// Update: Prerequisites.
    'ns_s_ns': 2,			// Query: Name servers.
    'ns_s_ud': 2,			// Query: Update.
    'ns_s_ar': 3,			// Query|Update: Additional records.
    'ns_s_max': 4
};

module.exports.ns_flag = {
    'ns_f_qr': 0,			// Question/Response.
    'ns_f_opcode': 1,		// Operation code.
    'ns_f_aa': 2,			// Authorative Answer.
    'ns_f_tc': 3,			// Truncation occured.
    'ns_f_rd': 4,			// Recursion Desired.
    'ns_f_ra': 5,			// Recursion Available.
    'ns_f_z': 6,			// MBZ
    'ns_f_ad': 7,			// Authentic Data (DNSSEC)
    'ns_f_cd': 8,			// Checking Disabled (DNSSEC)
    'ns_f_rcode': 9,		// Response code.
    'ns_f_max': 10
};

// Currently defined opcodes.
module.exports.ns_opcode = {
    'ns_o_query': 0, 		// Standard query.
    'ns_o_iquery': 1,		// Inverse query (deprecated/unsupported).
    'ns_o_status': 2, 		// Name server status query (unsupported).
							// Opcode 3 is undefined/reserved
    'ns_o_notify': 4,		// Zone change notification.
    'ns_o_update': 5		// Zone update message.
};

// Currently defined response codes
module.exports.ns_rcode = {
    'ns_r_noerror': 0,		// No error occured.
    'ns_r_formerr': 1,		// Format error.
    'ns_r_servfail': 2,		// Server failure.
    'ns_r_nxdomain': 3,		// Name error.
    'ns_r_notimpl': 4,		// Unimplemented.
    'ns_r_refused': 5,		// Operation refused.
	
	// These are for BIND_UPDATE
    'ns_r_yxdomain': 6,		// Name exists
    'ns_r_yxrrset': 7,		// RRset exists
    'ns_r_nxrrset': 8,		// RRset does not exist
    'ns_r_notauth': 9,		// Not authoritative for zone
    'ns_r_notzone': 10,		// Zone of record different from zone section
    'ns_r_max': 11,
	
	// The following are EDNS extended rcodes
    'ns_r_badvers': 16,

	// The following are TSIG errors
    'ns_r_badsig': 16,
    'ns_r_badkey': 17,
    'ns_r_badtime': 18
};

// BIND_UPDATE
module.exports.ns_update_operation = {
    'ns_oup_delete': 0,
    'ns_oup_add': 1,
    'ns_oup_max': 2
};

module.exports.NS_TSIG = {
    'NS_TSIG_FUDGE': 300,
    'NS_TSIG_TCP_COUNT': 100,
    'NS_TSIG_ALG_HMAC_MD5': 'HMAC-MD5.SIG-ALG.REG.INT',

    'NS_TSIG_ERROR_NO_TSIG': -10,
    'NS_TSIG_ERROR_NO_SPACE': -11,
    'NS_TSIG_ERROR_FORMERR': -12
};

// Currently defined type values for resources and queries.
module.exports.ns_type = {
    'ns_t_invalid': 0,		// Cookie.
    'ns_t_a': 1,			// Host address.
    'ns_t_ns': 2,			// Authoritative server.
    'ns_t_md': 3,			// Mail destination.
    'ns_t_mf': 4,			// Mail forwarder.
    'ns_t_cname': 5,		// Canonical name.
    'ns_t_soa': 6,			// Start of authority zone.
    'ns_t_mb': 7,			// Mailbox domain name.
    'ns_t_mg': 8,			// Mail group member.
    'ns_t_mr': 9,			// Mail rename name.
    'ns_t_null': 10,		// Null resource record.
    'ns_t_wks': 11,			// Well known service.
    'ns_t_ptr': 12,			// Domain name pointer.
    'ns_t_hinfo': 13,		// Host information.
    'ns_t_minfo': 14,		// Mailbox information.
    'ns_t_mx': 15,			// Mail routing information.
    'ns_t_txt': 16,			// Text strings.
    'ns_t_rp': 17,			// Responsible person.
    'ns_t_afsdb': 18,		// AFS cell database.
    'ns_t_x25': 19,			// X_25 calling address.
    'ns_t_isdn': 20,		// ISDN calling address.
    'ns_t_rt': 21,			// Router.
    'ns_t_nsap': 22,		// NSAP address.
    'ns_t_ns_nsap_ptr': 23,	// Reverse NSAP lookup (deprecated)
    'ns_t_sig': 24,			// Security signature.
    'ns_t_key': 25,			// Security key.
    'ns_t_px': 26,			// X.400 mail mapping.
    'ns_t_gpos': 27,		// Geographical position (withdrawn).
    'ns_t_aaaa': 28,		// Ip6 Address.
    'ns_t_loc': 29,			// Location Information.
    'ns_t_nxt': 30,			// Next domain (security)
    'ns_t_eid': 31,			// Endpoint identifier.
    'ns_t_nimloc': 32,		// Nimrod Locator.
    'ns_t_srv': 33,			// Server Selection.
    'ns_t_atma': 34,		// ATM Address
    'ns_t_naptr': 35,		// Naming Authority PoinTeR
    'ns_t_kx': 36,			// Key Exchange
    'ns_t_cert': 37,		// Certification Record
    'ns_t_a6': 38,			// IPv6 Address (deprecated, use ns_t_aaaa)
    'ns_t_dname': 39,		// Non-terminal DNAME (for IPv6)
    'ns_t_sink': 40,		// Kitchen sink (experimental)
    'ns_t_opt': 41,			// EDNS0 option (meta-RR)
    'ns_t_apl': 42,			// Address prefix list (RFC3123)
    'ns_t_ds': 43,			// Delegation Signer
    'ns_t_sshfp': 44,		// SSH Fingerprint
    'ns_t_ipseckey': 45,	// IPSEC Key
    'ns_t_rrsig': 46,		// RRSet Signature
    'ns_t_nsec': 47,		// Negative Security
    'ns_t_dnskey': 48,		// DNS Key
    'ns_t_dhcid': 49,		// Dynamic host configuartion identifier
    'ns_t_nsec3': 50,		// Negative security type 3
    'ns_t_nsec3param': 51,	// Negative security type 3 parameters
    'ns_t_hip': 55,			// Host Identity Protocol
    'ns_t_spf': 99,			// Sender Policy Framework
    'ns_t_tkey': 249,		// Transaction key
    'ns_t_tsig': 250,		// Transaction signature.
    'ns_t_ixfr': 251,		// Incremental zone transfer.
    'ns_t_axfr': 252,		// Transfer zone of authority.
    'ns_t_mailb': 253,		// Transfer mailbox records.
    'ns_t_maila': 254,		// Transfer mail agent records.
    'ns_t_any': 255,		// Wildcard match.
    'ns_t_zxfr': 256,		// BIND-specific, nonstandard.
    'ns_t_dlv': 32769,		// DNSSEC look-aside validation.
    'ns_t_max': 65536
};

// Values for class field
module.exports.ns_class = {
    'ns_c_invalid':  0,		// Cookie.
    'ns_c_in': 1,			// Internet.
    'ns_c_2': 2,			// unallocated/unsupported.
    'ns_c_chaos': 3,		// MIT Chaos-net.
    'ns_c_hs': 4,			// MIT Hesoid.
    
    // Query class values which do not appear in resource records
    'ns_c_none': 254,		// for prereq. sections in update requests
    'ns_c_any': 255,		// Wildcard match.
    'ns_c_max': 65535
};

// DNSSEC constants.
module.exports.ns_key_types = {
    'ns_kt_rsa': 1,			// key type RSA/MD5
    'ns_kt_dh': 2,			// Diffie Hellman
    'ns_kt_dsa': 3,			// Digital Signature Standard (MANDATORY)
    'ns_kt_private': 4		// Private key type starts with OID
};

module.exports.ns_cert_type = {
    'cert_t_pkix': 1,		// PKIX (X.509v3)
    'cert_t_spki': 2,		// SPKI
    'cert_t_pgp': 3, 		// PGP
    'cert_t_url': 253,		// URL private type
    'cert_t_oid': 254		// OID private type
};

// Flags field of the KEY RR rdata

module.exports.ns_type_elt = 0x40; 	//edns0 extended label type
module.exports.dns_labeltype_bitstring = 0x41;
module.exports.digitvalue = [
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 16
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 32
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 48
     0,  1,  2,  3,  4,  5,  6,  7,  8,  9, -1, -1, -1, -1, -1, -1, // 64
	-1, 10, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 80
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 96
	-1, 12, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 112
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, // 128
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 // 256
];

module.exports.hexvalue = [
    '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f', 
    '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f', 
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', 
    '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f', 
    '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f', 
    '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f', 
    '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f', 
    '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f', 
    '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f', 
    '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f', 
    'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 
    'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf', 
    'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 
    'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df', 
    'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 
    'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff'
];
    
module.exports.digits = '0123456789';

module.exports.ns_flagdata = [
    { mask: 0x8000, shift: 15 },	// qr.
    { mask: 0x7800, shift: 11 },	// opcode.
    { mask: 0x0400, shift: 10 },	// aa.
    { mask: 0x0200, shift: 9 },		// tc.
    { mask: 0x0100, shift: 8 }, 	// rd.
    { mask: 0x0080, shift: 7 }, 	// ra.
    { mask: 0x0040, shift: 6 }, 	// z.
    { mask: 0x0020, shift: 5 }, 	// ad.
    { mask: 0x0010, shift: 4 }, 	// cd.
    { mask: 0x000f, shift: 0 }, 	// rcode.
    { mask: 0x0000, shift: 0 }, 	// expansion (1/6).
    { mask: 0x0000, shift: 0 }, 	// expansion (2/6).
    { mask: 0x0000, shift: 0 }, 	// expansion (3/6).
    { mask: 0x0000, shift: 0 }, 	// expansion (4/6).
    { mask: 0x0000, shift: 0 }, 	// expansion (5/6).
    { mask: 0x0000, shift: 0 }  	// expansion (6/6).
];

module.exports.res_opcodes = [
    'QUERY',
    'IQUERY',
    'CQUERYM',
    'CQUERYU',	// experimental
    'NOTIFY',	// experimental
    'UPDATE',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    'ZONEINIT',
    'ZONEREF'
];

module.exports.res_sectioncodes = [
    'ZONE',
    'PREREQUISITES',
    'UPDATE',
    'ADDITIONAL'
];

module.exports.p_class_syms = {
    '1': 'IN',
    '3': 'CHAOS',
    '4': 'HESOID',
    '254': 'ANY',
    '255': 'NONE'
};

module.exports.p_default_section_syms = {
    '0': 'QUERY',
    '1': 'ANSWER',
    '2': 'AUTHORITY',
    '3': 'ADDITIONAL'
};

module.exports.p_key_syms = {
    '1': ['RSA', 'RSA KEY with MD5 hash'],
    '2': ['DH', 'Diffie Hellman'],
    '3': ['DSA', 'Digital Signature Algorithm'],
    '4': ['PRIVATE', 'Algorithm obtained from OID']
};

module.exports.p_cert_syms = {
    '1': ['PKIX', 'PKIX (X.509v3) Certificate'],
    '2': ['SKPI', 'SPKI Certificate'],
    '3': ['PGP', 'PGP Certificate'],
    '253': ['URL', 'URL Private'],
    '254': ['OID', 'OID Private']
};

module.exports.p_type_syms = {
    '1': 'A',
    '2': 'NS',
    '3': 'MD',
    '4': 'MF',
    '5': 'CNAME',
    '6': 'SOA',
    '7': 'MB',
    '8': 'MG',
    '9': 'MR',
    '10': 'NULL',
    '11': 'WKS',
    '12': 'PTR',
    '13': 'HINFO',
    '14': 'MINFO',
    '15': 'MX',
    '16': 'TXT',
    '17': 'RP',
    '18': 'AFSDB',
    '19': 'X25',
    '20': 'ISDN',
    '21': 'RT',
    '22': 'NSAP',
    '23': 'NSAP_PTR',
    '24': 'SIG',
    '25': 'KEY',
    '26': 'PX',
    '27': 'GPOS',
    '28': 'AAAA',
    '29': 'LOC',
    '30': 'NXT',
    '31': 'EID',
    '32': 'NIMLOC',
    '33': 'SRV',
    '34': 'ATMA',
    '35': 'NAPTR',
    '36': 'KX',
    '37': 'CERT',
    '38': 'A6',
    '39': 'DNAME',
    '40': 'SINK',
    '41': 'OPT',
    '42': 'APL',
    '43': 'DS',
    '44': 'SSHFP',
    '45': 'IPSECKEY',
    '46': 'RRSIG',
    '47': 'NSEC',
    '48': 'DNSKEY',
    '49': 'DHCID',
    '50': 'NSEC3',
    '51': 'NSEC3PARAM',
    '55': 'HIP',
    '99': 'SPF',
    '249': 'TKEY',
    '250': 'TSIG',
    '251': 'IXFR',
    '252': 'AXFR',
    '253': 'MAILB',
    '254': 'MAILA',
    '255': 'ANY',
    '32769': 'DLV',
    '256': 'ZXFR'
};

module.exports.p_rcode_syms = {
    '0': ['NOERROR', 'no error'],
    '1': ['FORMERR', 'format error'],
    '2': ['SERVFAIL', 'server failed'],
    '3': ['NXDOMAIN', 'no such domain name'],
    '4': ['NOTIMP', 'not implemented'],
    '5': ['REFUSED', 'refused'],

	// These are for BIND_UPDATE
    '6': ['YXDOMAIN', 'domain name exist'],
    '7': ['YXRRSET', 'rrset exists'],
    '8': ['NXRRSET', 'rrset doesn\'t exist'],
    '9': ['NOTAUTH', 'not authoritative'],
    '10': ['NOTZONE', 'not in zone'],
    '11': ['', ''],

	// The following are EDNS extended rcodes

	// The following are TSIG errors
    '16': ['BADSIG', 'bad signature'],
    '17': ['BADKEY', 'bad key'],
    '18': ['BADTIME', 'bad time']
};
