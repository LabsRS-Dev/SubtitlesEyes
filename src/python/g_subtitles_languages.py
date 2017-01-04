# coding=utf-8
#!/usr/bin/env python
# -*- coding: utf-8 -*-
__author__ = 'Ian'
__create_date__ = '2015/1/1'



## opensubtitles
LANGUAGE_MATRIX = {}
f = open('opensubtitles_languages.txt', 'r')
f.readline()
for l in f:
    idlang, alpha2, description, upload_enabled, web_enabled = l.decode('utf-8').strip().split('\t')
    if alpha2:
        LANGUAGE_MATRIX[alpha2] = description
f.close()

## iso-639-3

ISO_LANGUAGE_MATRIX = {}
from collections import namedtuple
IsoLanguage = namedtuple('IsoLanguage', ['alpha3', 'alpha3b', 'alpha3t', 'alpha2', 'scope', 'type', 'name', 'comment'])
fi = open('iso-639-3.tab', 'r')
fi.readline()
for l in fi:
    iso_language = IsoLanguage(*l.decode('utf-8').split('\t'))
    if iso_language.alpha2:
        ISO_LANGUAGE_MATRIX[iso_language.alpha2] = iso_language.alpha3
fi.close()


## Final Language
FINAL_LANGUAGE_MATRIX = {}
for isoL in ISO_LANGUAGE_MATRIX:
    if isoL in LANGUAGE_MATRIX:
        FINAL_LANGUAGE_MATRIX[ISO_LANGUAGE_MATRIX[isoL]] = LANGUAGE_MATRIX[isoL]

fw = open('thefile.json', 'wb')
fw.write("{\t\n")
sortKey = sorted(FINAL_LANGUAGE_MATRIX)
jsonA = {}
for key in sortKey:
    value = FINAL_LANGUAGE_MATRIX[key]
    str = ('\t \"%s\":\"%s\",\n' % (key, value)).encode("utf-8")
    fw.write(str)
fw.write("\n}\n")
fw.close()