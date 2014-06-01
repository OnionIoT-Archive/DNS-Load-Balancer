var dgram = require('dgram');
var events = require('events');
var Buffer = require('buffer').Buffer;

var n_type_syms = {};

for (var k in p_type_syms) {
    n_type_syms[p_type_syms[k]] = k;
}

var n_class_syms = {};
for (var k in p_class_syms) {
    n_class_syms[p_class_syms[k]] = k;
}

function ns_name_ntop (src, dst, dstsiz) {
    var cp;
    var dn, eom;
    var c;
    var n;
    var l;

    cp = 0;
    dn = 0;
    eom = dstsiz;

    while((n = src[cp++]) != 0) {
	if((n & ns_cmprsflgs) == ns_cmprsflgs) {
	    /* some kind of compression pointer */
	    errno.set('EMSGSIZE');
	    return (-1);
	}
	if(dn != 0) {
	    if(dn >= eom) {
		errno.set('EMSGSIZE');
		return (-1);
	    }
	    dst[dn++] = 0x2e; /* '.' */
	}
	if ((l = labellen(src, cp - 1)) < 0) {
	    errno.set('EMSGSIZE');
	    return (-1);
	}
	if(dn + l >= eom) {
	    errno.set('EMSGSIZE');
	    return (-1);
	}
	if((n & ns_cmprsflgs) == ns_type_elt) {
	    var m;

	    if(n != dns_labeltype_bitstring) {
		/* labellen should reject this case */
		return (-1);
	    }
	    var cpp = new Ptr(cp);
	    if ((m = decode_bitstring(src, cpp, dst, dn, eom)) < 0) {
		errno.set('EMSGSIZE');
		return (-1);
	    }
	    cp = cpp.get();
	    dn += m;
	    continue;
	}
	for(; l > 0; l--) {
	    c = src[cp++];
	    if(special(c)) {
		if(dn + 1 >= eom) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}
		dst[dn++] = 0x5c; /* '\\' */
		dst[dn++] = c;
	    }
	    else if(!printable(c)) {
		if(dn + 3 >= eom) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}
		dst[dn++] = 0x5c; /* '\\' */
		dst[dn++] = digits[c / 100];
		dst[dn++] = digits[(c % 100) / 10];
		dst[dn++] = digits[c % 10];
	    }
	    else {
		if(dn >= eom) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}
		dst[dn++] = c;
	    }
	}
    }
    if (dn == 0) {
	if (dn >= eom) {
	    errno.set('EMSGSIZE');
	    return (-1);
	}
	dst[dn++] = 0x2e; // '.'
    }
    if (dn >= eom) {
	errno.set('EMSGSIZE');
	return (-1);
    }
    dst[dn] = 0;
    return (dn);
}

function ns_name_pton (src, dst, dstsiz) {
    return ns_name_pton2(src, dst, dstsiz, null);
}

function ns_name_pton2(src, dst, dstsiz, dstlenp) {
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
		if ((cp = strchr(src, srcn, 93)) == null) { // ']'
		    errno.set('EINVAL');
		    return(-1);
		}
		var srcp = new Ptr(srcn);
		var bpp = new Ptr(bp);
		var labelp = new Ptr(label);
		if ((e = encode_bitstring (src, srcp, cp + 2,
					   labelp, dst, bpp, eom)
		     != 0)) {
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
	    }
	    else if ((cp = digits.indexOf(String.fromCharCode(c))) != -1) {
		n = (cp * 100);
		if ((c = src[srcn++]) ||
		    (cp = digits.indexOf(String.fromCharCode(c))) == -1) {
		    errno.set('EMSGSIZE');
		    return (-1);
		}
		n += (cp) * 10;
		if ((c = src[srcn++]) == 0 ||
		    (cp = digits.indexOf(String.fromCharCode(c))) == -1) {
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
	    c = (bp - label - 1)
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
		if (dstlenp != null) {
		    dstlenp.set(bp);
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
    if (dstlenp != null) {
	dstlenp.set(bp);
    }
    return (0);
}

function strchr (src, off, n) {
    while (off < buf.length && buf[off] != 0) {
	if (buf[off] == n)
	    return off;
	off++;
    }
    return null;
}

function ns_name_unpack (msg, offset, len, dst, dstsiz) {
    return ns_name_unpack2 (msg, offset, len, dst, dstsiz, null);
}

function ns_name_unpack2 (msg, offset, len, dst, dstsiz, dstlenp) {
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
	switch(n & ns_cmprsflgs) {
	case 0:
	case ns_type_elt:
	    /* Limit checks */
	    
	    if((l = labellen(msg, srcn - 1)) < 0) {
		errno.set('EMSGSIZE');
		return (-1);
	    }
	    if(dstn + l + 1 >= dstlim || srcn + l >= eom) {
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
	    if(srcn >= eom) {
		errno.set('EMSGSIZE');
		return (-1);
	    }
	    if(llen < 0) {
		llen = (srcn - offset) + 1;
	    }
	    
	    srcn = (((n & 0x3F) * 256) | (msg[srcn] & 0xFF));

	    if(srcn < 0 || srcn >= eom) { /* Out of range */
		errno.set('EMSGSIZE');
		return (-1);
	    }
	    
	    checked += 2;
	    /* check for loops in compressed name */
	    if(checked >= eom) {
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
    if (dstlenp != null)
	dstlenp.set(dstn);
    if(llen < 0)
	llen = srcn - offset;
    return (llen);
}

function ns_name_pack (src, dst, dstn, dstsiz, dnptrs, lastdnptr) {
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
    } else
	msg = null;

    // make sure the domain we are about to add is legal
    l = 0;
    do {
	var l0;

	n = src[srcp];
	if ((n & ns_cmprsflgs) == ns_cmprsflgs) {
	    errno.set('EMSGSIZE');
	    return (-1);
	}
	if ((l0 = labellen(src, srcp)) < 0) {
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
	    if (lastdnptr != null && cpp < lastdnptr - 1 &&
		(dstp) < 0x4000 && first) {
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
	n = labellen(src, srcp);
	if (dstp + 1 + n >= eob) {
	    cleanup = true;
	    break;
	}
	src.copy(dst, dstp, srcp, srcp + (n + 1));
	srcp += n + 1;
	dstp += n + 1;
	
    } while (n != 0);

    if (dstp > eob ||
// cleanup:
	cleanup) {
	if (msg != null) {
	    dnptrs[lpp] = null;
	}
	errno.set('EMSGSIZE');
	return (-1);
    }
    return (dstp - dstn);
}

function ns_name_skip (b, ptrptr, eom) {
    var cp;
    var n;
    var l;

    cp = ptrptr.get();
    while (cp < eom && (n = b[cp++]) != 0) {
	switch (n & ns_cmprsflgs) {
	case 0: // normal case, n == len
	    cp += n;
	    continue;
	case ns_type_elt: // edns0 extended label
	    if ((l = labellen(b, cp - 1)) < 0) {
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
}

function special(ch) {
    switch(ch) {
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
}

function printable (ch) {
    return (ch > 0x20 && ch < 0x7F);
}

function mklower (ch) {
    if (ch >= 0x41 && ch <= 0x5A)
	return (ch + 0x20);
    return (ch);
}

function dn_find(src, domain, msg, dnptrs, ndnptr, lastdnptr) {
    var dn, cp, sp;
    var cpp;
    var n;

    var next = false; // instead of goto
    for (cpp = ndnptr; cpp < lastdnptr; cpp++) {
	sp = dnptrs[cpp];
	//
	// terminate search on:
	// root label
	// compression pointer
	// unusable offset
	//
	while (msg[sp] != 0 && (msg[sp] & ns_cmprsflgs) == 0 &&
	       (sp) < 0x4000) {
	    dn = domain;
	    cp = sp;
	    while ((n = msg[cp++]) != 0) {
		//
		// check for indirection
		//
		switch (n & ns_cmprsflgs) {
		case 0: // normal case, n == len
		    n = labellen(msg, cp - 1) // XXX
		    if (n != src[dn++]) {
			next = true;
			break;
		    }
		    for (null; n > 0; n--) {
			if (mklower(src[dn++]) !=
			    mklower(msg[cp++])) {
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
		    if (src[dn])  {
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
	    if (next)
		next = false;
	}
    }
    errno.set('ENOENT');
    return (-1);
}

function decode_bitstring (b, cpp, d, dn, eom) {
    var cp = cpp.get();
    var beg = dn, tc;
    var b, blen, plen, i;

    if ((blen = (b[cp] & 0xff)) == 0)
	blen = 256;
    plen = (blen + 3) / 4;
    plen += "\\[x/]".length + (blen > 99 ? 3 : (blen > 9) ? 2 : 1);
    if (dn + plen >= eom)
	return (-1);

    cp++;
    i = d.write("\\[x", dn);
    if (i != 3)
	return (-1);
    dn += i;
    for (b = blen; b > 7; b -= 8, cp++) {
	if (dn + 2 >= eom)
	    return (-1);
    }
}

function encode_bitstring (src, bp, end, labelp, dst, dstp, eom) {
    var afterslash = 0;
    var cp = bp.get();
    var tp;
    var c;
    var beg_blen;
    var end_blen = null;
    var value = 0, count = 0, tbcount = 0, blen = 0;

    beg_blen = end_blen = null;

    // a bitstring must contain at least two bytes
    if (end - cp < 2)
	return errno.EINVAL;

    // currently, only hex strings are supported
    if (src[cp++] != 120) // 'x'
	return errno.EINVAL;
    if (!isxdigit((src[cp]) & 0xff)) // reject '\[x/BLEN]'
	return errno.EINVAL;

    var done = false;
    for (tp = dstp.get() + 1; cp < end && tp < eom; cp++) {
	switch (c = src[cp++]) {
	case 93: // ']'
	    if (afterslash) {
		if (beg_blen == null)
		    return errno.EINVAL;
		blen = strtol(src, beg_blen, 10);
		// todo:
		// if ( char after string == ']' )
		// return errno.EINVAL;
	    }
	    if (count)
		dst[tp++] = ((value << 4) & 0xff);
	    cp++; // skip ']'
	    done = true;
	    break;
	case 47: // '/'
	    afterslash = 1;
	    break;
	default:
	    if (afterslash) {
		if (!isxdigit(c&0xff))
		    return errno.EINVAL;
		if (beg_blen == null) {

		    if (c == 48) { // '0'
			// blen never begins with 0
			return errno.EINVAL;
		    }
		    beg_blen = cp;
		}
	    } else {
		if (!isxdigit(c&0xff))
		    return errno.EINVAL;
		value <<= 4;
		value += digitvalue[c];
		count += 4;
		tbcount += 4;
		if (tbcount > 256)
		    return errno.EINVAL;
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
    if (cp >= end || tp >= eom)
	return errno.EMSGSIZE;
    // bit length validation:
    // If a <length> is present, the number of digits in the <bit-data>
    // MUST be just sufficient to contain the number of bits specified
    // by the <length>. If there are insufficient bits in a final
    // hexadecimal or octal digit, they MUST be zero.
    // RFC2673, Section 3.2
    if (blen && (blen > 0)) {
	var traillen;

	if (((blen + 3) & ~3) != tbcount)
	    return errno.EINVAL;
	traillen = tbcount - blen; // between 0 and 3
	if (((value << (8 - traillen)) & 0xFF) != 0)
	    return errno.EINVAL;
    }
    else
	blen = tbcount;
    if (blen == 256)
	blen = 0;

    // encode the type and the significant bit fields
    src[labelp.get()] = dns_labeltype_bitstring;
    dst[dstp.get()] = blen;

    bp.set(cp);
    dstp.set(tp);

    return (0);
}

function isxdigit (ch) {
    return ((ch >= 48 && ch <= 57)
	    || (ch >= 97 && ch <= 102)
	    || (ch >= 65 && ch <= 70));
}

function isspace (ch) {
    return (ch == 32 || ch == 12 || ch == 10 || ch == 13 || ch == 9 || ch == 12);
}

function strtol (b, off, end, base) {
    // todo: port from C
    return parseInt(b.toString(off, end), base);
}

function labellen (b, off) {
    var bitlen;
    var l = b[off];

    if((l & ns_cmprsflgs) == ns_cmprsflgs) {
	return (-1);
    }
    if((l & ns_cmprsflgs) == ns_type_elt) {
	if(l == dns_labeltype_bitstring) {
	    bitlen = b[off + 1];
	    if(bitlen == 0) {
		bitlen = 256;
	    }
	    return (1 + (bitlen + 7) / 8);
	}
    }
    return (l);
}

var errno = {
    val: {
	"ENOENT": 2,
	"EINVAL": 22,
	"EMSGSIZE": 90,
    },
    errno: null,
    set: function (name) {
	if (typeof name === 'string' && this.val[name]) {
	    this.errno = name;
	}
    },
    get: function () {
	return this.errno;
    },
};