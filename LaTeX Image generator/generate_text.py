#!/usr/bin/env python

import os, sys, re, hashlib, subprocess

TEXT_RE = re.compile("\"TEX:(.*)\"");

TEXT_DIR = "text"

if len(sys.argv) <= 1:
    print "Usage: generate_text <filenames>"
    sys.exit(0);

if not os.path.isdir(TEXT_DIR):
    os.mkdir(TEXT_DIR)

def unescape(s):
    chars = []
    i = 0
    while i < len(s):
        if s[i] != "\\":
            chars.append(s[i])
        else:
            if i == len(s) - 1:
                break
            i += 1
            if s[i] == "b":
                chars.append("\b")
            elif s[i] == "f":
                chars.append("\f")
            elif s[i] == "n":
                chars.append("\n")
            elif s[i] == "r":
                chars.append("\r")
            elif s[i] == "t":
                chars.append("\t")
            elif s[i] == "v":
                chars.append("\v")
            elif s[i] == "'":
                chars.append("'")
            elif s[i] == '"':
                chars.append('"')
            elif s[i] == "\\":
                chars.append("\\")
        i += 1
    return "".join(chars)

for filename in sys.argv[1:]:
    with open(filename) as file:
        for line in file:
            match = TEXT_RE.search(line)
            if match:
                text = unescape(match.group(1))
                hash = hashlib.sha1(text).hexdigest()
                print(hash + " " + text)
                tex_filename = hash + ".tex"
                pdf_filename = hash + ".pdf"
                tmp_filename = hash + "_tmp.png"
                img_filename = hash + ".png"
                tex_full_filename = os.path.join(TEXT_DIR, tex_filename)
                img_full_filename = os.path.join(TEXT_DIR, img_filename)
                if not os.path.exists(img_full_filename):
                    print("Writing tex file " + tex_full_filename);
                    with open(tex_full_filename, "w") as texfile:
                        texfile.write("\\documentclass[12pt]{article}\n")
                        texfile.write("\\usepackage{amsmath,amsthm,amssymb}\n")
                        texfile.write("\\begin{document}\n")
                        texfile.write("\\thispagestyle{empty}\n")
                        texfile.write(text + "\n")
                        texfile.write("\\end{document}\n")
                    print("Running pdflatex on " + tex_filename);
                    subprocess.check_call(["pdflatex", tex_filename], cwd=TEXT_DIR)
                    print("Running convert on " + pdf_filename);
                    subprocess.check_call(["convert", "-density", "96",
                                           pdf_filename, "-trim", "+repage",
                                           img_filename], cwd=TEXT_DIR)
