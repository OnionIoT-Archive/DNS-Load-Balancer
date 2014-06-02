'use strict';

var consts = require('./consts'),
	errno = require('./errno'),
	Ptr = require('./ptr');

var decodeBitString = function (b, cpp, d, dn, eom) {
    var cp = cpp.get();
    var beg = dn, tc;
    var b, blen, plen, i;

    if ((blen = (b[cp] & 0xff)) == 0) {
		blen = 256;
    }

    plen = (blen + 3) / 4;
    plen += '\\[x/]'.length + (blen > 99 ? 3 : (blen > 9) ? 2 : 1);
    
    if (dn + plen >= eom) {
		return (-1);
    }

    cp++;
    i = d.write('\\[x', dn);
    if (i != 3) {
		return (-1);
    }

    dn += i;
    for (b = blen; b > 7; b -= 8, cp++) {
		if (dn + 2 >= eom) {
	    	return (-1);
		}
    }
};

var encodeBitString = function (src, bp, end, labelp, dst, dstp, eom) {
    var afterslash = 0;
    var cp = bp.get();
    var tp;
    var c;
    var beg_blen;
    var end_blen = null;
    var value = 0, count = 0, tbcount = 0, blen = 0;

    beg_blen = end_blen = null;

    // a bitstring must contain at least two bytes
    if (end - cp < 2) {
		return errno.EINVAL;
    }

    // currently, only hex strings are supported
    if (src[cp++] != 120) { // 'x'
		return errno.EINVAL;
	}

    if (!isAlphaNumeric((src[cp]) & 0xff)) {// reject '\[x/BLEN]'
		return errno.EINVAL;
	}

    var done = false;
    for (tp = dstp.get() + 1; cp < end && tp < eom; cp++) {
		switch (c = src[cp++]) {
			case 93: // ']'
			    if (afterslash) {
					if (beg_blen == null) {
					    return errno.EINVAL;
					}

					blen = toInteger(src, beg_blen, 10);
					// todo:
					// if ( char after string == ']' )
					// return errno.EINVAL;
			    }
			    if (count) {
					dst[tp++] = ((value << 4) & 0xff);
			    }

			    cp++; // skip ']'
			    done = true;
			    break;
			
			case 47: // '/'
			    afterslash = 1;
			    break;
			
			default:
			    if (afterslash) {
					if (!isAlphaNumeric(c&0xff)) {
					    return errno.EINVAL;
					}
					if (beg_blen == null) {

					    if (c == 48) { // '0'
							// blen never begins with 0
							return errno.EINVAL;
					    }
					    beg_blen = cp;
					}
			    } else {
					if (!isAlphaNumeric(c&0xff)) {
					    return errno.EINVAL;
					}
					value <<= 4;
					value += digitvalue[c];
					count += 4;
					tbcount += 4;
					if (tbcount > 256) {
					    return errno.EINVAL;
					}

					if (count == 8) {
					    dst[tp++] = value;
					    count = 0;
					}
			    }
			    break;
		}

		if (done) {
		    break;
		}
    }

    // done:
    if (cp >= end || tp >= eom) {
		return errno.EMSGSIZE;
    }

    // bit length validation:
    // If a <length> is present, the number of digits in the <bit-data>
    // MUST be just sufficient to contain the number of bits specified
    // by the <length>. If there are insufficient bits in a final
    // hexadecimal or octal digit, they MUST be zero.
    // RFC2673, Section 3.2
    if (blen && (blen > 0)) {
		var traillen;

		if (((blen + 3) & ~3) != tbcount) {
		    return errno.EINVAL;
		}

		traillen = tbcount - blen; // between 0 and 3

		if (((value << (8 - traillen)) & 0xFF) != 0) {
		    return errno.EINVAL;
		}
    } else {
		blen = tbcount;
	}

    if (blen == 256) {
		blen = 0;
    }

    // encode the type and the significant bit fields
    src[labelp.get()] = dns_labeltype_bitstring;
    dst[dstp.get()] = blen;

    bp.set(cp);
    dstp.set(tp);

    return (0);
};

var isSpecial = function (charCode) {
    switch(charCode) {
        case 0x22: /* '"' */
        case 0x2E: /* '.' */
        case 0x3B: /* ';' */
        case 0x5C: /* '\\' */
        case 0x28: /* '(' */
        case 0x29: /* ')' */
        
        /* special modifiers in the zone file */
        case 0x40: /* '@' */
        case 0x24: /* '$' */
    		return (1);

        default:
    		return (0);
    }
};

// Check if charCode is within the ASCII limit
var isPrintable = function (charCode) {
    return (charCode > 0x20 && charCode < 0x7F);
};

// to lower case for charCode code
var toLowerCase = function (charCode) {
    if (charCode >= 0x41 && charCode <= 0x5A) {
		return (charCode + 0x20);
    } else {
    	return (charCode);
    }
}

//String search
var bitStringSearch = function (buffer, offset, charCode) {
    while (offset < buffer.length && buffer[offset] != 0) {
		if (buffer[offset] == charCode) {
		    return offset;
		}
		offset++;
    }

    return null;
};

var isAlphaNumeric = function (charCode) {
    return ((charCode >= 48 && charCode <= 57) || (charCode >= 97 && charCode <= 102) || (charCode >= 65 && charCode <= 70));
};

var isSpace = function (charCode) {
    return (charCode == 32 || charCode == 12 || charCode == 10 || charCode == 13 || charCode == 9 || charCode == 12);
};

var toInteger = function (buffer, offset, end, base) {
    // todo: port from C
    return parseInt(buffer.toString(offset, end), base);
};

var labelLength = function (buffer, offset) {
    var bitlen;
    var label = buffer[offset];

    if ((label & consts.ns_cmprsflgs) == consts.ns_cmprsflgs) {
		return (-1);
    }

    if ((label & consts.ns_cmprsflgs) == consts.ns_type_elt) {
		if (label == consts.dns_labeltype_bitstring) {
		    bitlen = buffer[off + 1];
		    
		    if (bitlen == 0) {
				bitlen = 256;
		    }

		    return (1 + (bitlen + 7) / 8);
		}
    }

    return (label);
};


/****************
    Convert an encoded domain name to printable ascii as per RFC1035.
****************/

function ns_name_ntop (source, destination, destinationSize) {
    var cp, dn, eom, c, n, l;

    cp = 0;
    dn = 0;
    eom = destinationSize;

    while ((n = source[cp++]) != 0) {
		if ((n & consts.ns_cmprsflgs) == consts.ns_cmprsflgs) {
		    /* some kind of compression pointer */
		    errno.set('EMSGSIZE');
		    return (-1);
		}

		if (dn != 0) {
		    if(dn >= eom) {
				errno.set('EMSGSIZE');
				return (-1);
		    }

		    destination[dn++] = 0x2e; /* '.' */
		}

		if ((l = labelLength(source, cp - 1)) < 0) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}

		if(dn + l >= eom) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}

		if ((n & consts.ns_cmprsflgs) == consts.ns_type_elt) {
		    var m;

		    if (n != consts.dns_labeltype_bitstring) {
				/* labelLength should reject this case */
				return (-1);
		    }

		    var cpp = new Ptr(cp);

		    if ((m = decodeBitString(source, cpp, destination, dn, eom)) < 0) {
				errno.set('EMSGSIZE');
				return (-1);
		    }

		    cp = cpp.get();
		    dn += m;
		    continue;
		}

		for (; l > 0; l--) {
		    c = source[cp++];

		    if (isSpecial(c)) {
				if (dn + 1 >= eom) {
				    errno.set('EMSGSIZE');
				    return (-1);
				}

				destination[dn++] = 0x5c; /* '\\' */
				destination[dn++] = c;
		    } else if (!isPrintable(c)) {
				if (dn + 3 >= eom) {
				    errno.set('EMSGSIZE');
				    return (-1);
				}

				destination[dn++] = 0x5c; /* '\\' */
				destination[dn++] = digits[c / 100];
				destination[dn++] = digits[(c % 100) / 10];
				destination[dn++] = digits[c % 10];
		    } else {
				if (dn >= eom) {
				    errno.set('EMSGSIZE');
				    return (-1);
				}

				destination[dn++] = c;
		    }
		}
    }

    if (dn == 0) {
		if (dn >= eom) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}

		destination[dn++] = 0x2e; // '.'
    }

    if (dn >= eom) {
		errno.set('EMSGSIZE');
		return (-1);
    }

    destination[dn] = 0;
    return (dn);
};


/****************
    Convert a ascii string into an encoded domain name as per RFC1035.
****************/

var ns_name_pton = function (src, dst, dstsiz) {
    var label, bp, epm
    var c, n, escaped, e = 0;
    var cp;

    escaped = 0;
    bp = 0;
    eom = dstsiz;
    label = bp++;

    var srcn = 0;
    var done = false; // instead of goto
    while ((c = src[srcn++]) != 0) {
		if (escaped) {
		    if (c == 91) { // '['; start a bit string label
				if ((cp = bitStringSearch(src, srcn, 93)) == null) { // ']'
				    errno.set('EINVAL');
				    return(-1);
				}

				var srcp = new Ptr(srcn);
				var bpp = new Ptr(bp);
				var labelp = new Ptr(label);

				if ((e = encodeBitString(src, srcp, cp + 2, labelp, dst, bpp, eom) != 0)) {
				    errno.set(e);
				    return(-1);
				}

				label = labelp.get();
				bp = bpp.get();
				srcn = srcp.get();
				escaped = 0;
				label = bp++;

				if ((c = src[srcn++]) == 0) {
				    done = true;
				    break;
				}
		    } else if ((cp = digits.indexOf(String.fromCharCode(c))) != -1) {
				n = (cp * 100);

				if ((c = src[srcn++]) || (cp = digits.indexOf(String.fromCharCode(c))) == -1) {
				    errno.set('EMSGSIZE');
				    return (-1);
				}

				n += (cp) * 10;
				if ((c = src[srcn++]) == 0 || (cp = digits.indexOf(String.fromCharCode(c))) == -1) {
				    errno.set('EMSGSIZE');
				    return (-1);
				}

				n += cp;
				if (n > 255) {
				    errno.set('EMSGSIZE');
				    return (-1);
				}

				c = n;
		    }

		    escaped = 0;
		} else if (c == 92) { // '\\'
		    escaped = 1;

		    continue;
		} else if (c == 46) { // '.'
		    c = (bp - label - 1);
		    
		    if ((c & ns_cmprsflgs) != 0) { // label too big
				errno.set('EMSGSIZE');
				return (-1);
		    }
		    
		    if (label >= eom) {
				errno.set('EMSGSIZE');
				return (-1);
		    }

		    dst[label] = c;

		    // Fully qualified?
		    if (src[srcn] == 0) {
				if (c != 0) {
				    if (bp >= eom) {
						errno.set('EMSGSIZE');
						return (-1);
				    }
				    dst[bp++] = 0;
				}

				if ((bp) > ns_maxcdname) {
				    errno.set('EMSGSIZE');
				    return (-1);
				}

				return (1);
		    }

		    if (c == 0 || src[srcn] == 46) { // '.'
				errno.set('EMSGSIZE');
				return (-1);
		    }

		    label = bp++;

		    continue;
		}

		if (bp >= eom) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}

		dst[bp++] = c;
    }

    if (!done) {
		c = (bp - label - 1);

		if ((c & ns_cmprsflgs) != 0) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}
    }

	// done:
    
    if (label >= eom) {
		errno.set('EMSGSIZE');
		return (-1);
    }

    dst[label] = c;
    if (c != 0) {
		if (bp >= eom) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}

		dst[bp++] = 0;
    }

    if (bp > ns_maxcdname) { // src too big
		errno.set('EMSGSIZE');
		return (-1);
    }

    return (0);
};


/****************
    Unpack a domain name from a message, source may be compressed.
****************/

var ns_name_unpack = function (msg, offset, len, dst, dstsiz) {
    var n, l;
    var llen = -1;
    var checked = 0;
    var dstn = 0;
    var srcn = offset;
    var dstlim = dstsiz;
    var eom = offset + len;

    if (srcn < 0 || srcn >= eom) {
    	errno.set('EMSGSIZE');
    	return (-1);
    }

    /* Fetch next label in domain name */
    while((n = msg[srcn++]) != 0 && !isNaN(srcn)) {
		/* Check for indirection */
		switch (n & ns_cmprsflgs) {
			case 0:
			case ns_type_elt:
			    /* Limit checks */
			    
			    if ((l = labelLength(msg, srcn - 1)) < 0) {
					errno.set('EMSGSIZE');
					return (-1);
			    }

			    if (dstn + l + 1 >= dstlim || srcn + l >= eom) {
					errno.set('EMSGSIZE');
					return (-1);
			    }

			    checked += l + 1;
			    dst[dstn++] = n;
			    msg.copy(dst, dstn, srcn, srcn + l);
			    dstn += l;
			    srcn += l;
			    break;

			case ns_cmprsflgs:
			    if (srcn >= eom) {
					errno.set('EMSGSIZE');
					return (-1);
			    }

			    if (llen < 0) {
					llen = (srcn - offset) + 1;
			    }
			    
			    srcn = (((n & 0x3F) * 256) | (msg[srcn] & 0xFF));

			    if (srcn < 0 || srcn >= eom) { /* Out of range */
					errno.set('EMSGSIZE');
					return (-1);
			    }
			    
			    checked += 2;

			    /* check for loops in compressed name */
			    if (checked >= eom) {
					errno.set('EMSGSIZE');
					return (-1);
			    }
			    break;

			default:
			    errno.set('EMSGSIZE');
			    return (-1); // flag error
		}
    }

    dst[dstn] = 0;

    if(llen < 0) {
		llen = srcn - offset;
    }

    return (llen);
};


/****************
    Pack domain name 'domain' into 'comp_dn'.
****************/

var ns_name_pack = function (src, dst, dstn, dstsiz, dnptrs, lastdnptr) {
    var dstp;
    var cpp, lpp, eob, msgp;
    var srcp;
    var n, l, first = 1;

    srcp = 0;
    dstp = dstn;
    eob = dstp + dstsiz;
    lpp = cpp = null;
    var ndnptr = 0;
    if (dnptrs != null) {
		msg = dst;
		//if ((msg = dnptrs[ndnptr++]) != null) {
		    for (cpp = 0; dnptrs[cpp] != null; cpp++);
		    lpp = cpp; // end of list to search
		//}
    } else {
		msg = null;
    }

    // make sure the domain we are about to add is legal
    l = 0;
    do {
		var l0;

		n = src[srcp];

		if ((n & ns_cmprsflgs) == ns_cmprsflgs) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}

		if ((l0 = labelLength(src, srcp)) < 0) {
		    errno.set('EINVAL');
		    return (-1);
		}

		l += l0 + 1;
		if (l > ns_maxcdname) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}

		srcp += l0 + 1;
    } while (n != 0);

    // from here on we need to reset compression pointer array on error
    srcp = 0;
    var cleanup = false; // instead of goto
    do {
		// look to see if we can use pointers
		n = src[srcp];
		if (n != 0 && msg != null) {
		    l = dn_find(src, srcp, msg, dnptrs, ndnptr, lpp);

		    if (l >= 0) {
				if (dstp + 1 >= eob) {
				    cleanup = true;
				    break;
				}
				dst[dstp++] = (l >> 8) | ns_cmprsflgs;
				dst[dstp++] = l & 0xff;

				return (dstp - dstn);
		    }

		    // Not found, save it.
		    if (lastdnptr != null && cpp < lastdnptr - 1 && (dstp) < 0x4000 && first) {
				dnptrs[cpp++] = dstp;
				dnptrs[cpp++] = null;
				first = 0;
		    }
		}

		// copy label to buffer
		if ((n & ns_cmprsflgs) == ns_cmprsflgs) {
		    // should not happen
		    cleanup = true;
		    break;
		}

		n = labelLength(src, srcp);
		if (dstp + 1 + n >= eob) {
		    cleanup = true;
		    break;
		}

		src.copy(dst, dstp, srcp, srcp + (n + 1));
		srcp += n + 1;
		dstp += n + 1;
	
    } while (n != 0);

    if (dstp > eob || cleanup) { // cleanup:
		if (msg != null) {
		    dnptrs[lpp] = null;
		}
		errno.set('EMSGSIZE');
		return (-1);
    }

    return (dstp - dstn);
};


/****************
    Advance *ptrptr to skip over the compressed name it points at.
****************/

var ns_name_skip = function (b, ptrptr, eom) {
    var cp, n, l;

    cp = ptrptr.get();

    while (cp < eom && (n = b[cp++]) != 0) {
		switch (n & ns_cmprsflgs) {
			case 0: // normal case, n == len
			    cp += n;
			    continue;

			case ns_type_elt: // edns0 extended label
			    if ((l = labelLength(b, cp - 1)) < 0) {
					errno.set('EMSGSIZE');
					return (-1);
			    }
			    cp += l;
			    continue;

			case ns_cmprsflgs: // indirection
			    cp++;
			    break;

			default: // illegal type
			    errno.set('EMSGSIZE');
			    return (-1);
		}
		break;
    }

    if (cp > eom) {
		errno.set('EMSGSIZE');
		return (-1);
    }

    ptrptr.set(cp);

    return (0);
};


/****************
    Search for the counted-label name in an array of compressed names.
****************/

var dn_find = function (src, domain, msg, dnptrs, ndnptr, lastdnptr) {
    var dn, cp, sp, cpp, n;

    var next = false; // instead of goto

    for (cpp = ndnptr; cpp < lastdnptr; cpp++) {
		sp = dnptrs[cpp];
		//
		// terminate search on:
		// root label
		// compression pointer
		// unusable offset
		//
		while (msg[sp] != 0 && (msg[sp] & ns_cmprsflgs) == 0 && (sp) < 0x4000) {
		    dn = domain;
		    cp = sp;

		    while ((n = msg[cp++]) != 0) {
				//
				// check for indirection
				//
				switch (n & ns_cmprsflgs) {
					case 0: // normal case, n == len
					    n = labelLength(msg, cp - 1) // XXX
					    if (n != src[dn++]) {
							next = true;
							break;
					    }
					    for (null; n > 0; n--) {
							if (toLowerCase(src[dn++]) != toLowerCase(msg[cp++])) {
							    next = true;
							    break;
							}
					    }
					    if (next) {
							break;
					    }

					    // Is next root for both ?
					    if (src[dn] == 0 && msg[cp] == 0) {
							return (sp);
					    }

					    if (src[dn]) {
							continue;
					    }
					    next = true;
					    break;

					case ns_cmprsflgs: // indirection
					    cp = (((n & 0x3f) * 256) | msg[cp]);
					    break;

					default: // illegal type
					    errno.set('EMSGSIZE');
					    return (-1);
				}

				if (next) {
				    break;
				}
		    }

		    sp += msg[sp] + 1;

		    if (next) {
				next = false;
		    }
		}
    }

    errno.set('ENOENT');

    return (-1);
};

module.exports = {
	ns_name_ntop: ns_name_ntop,
	ns_name_pton: ns_name_pton,
	ns_name_unpack: ns_name_unpack,
	ns_name_pack: ns_name_pack,
	ns_name_skip: ns_name_skip,
	dn_find: dn_find
};

