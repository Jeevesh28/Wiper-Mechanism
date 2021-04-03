
all: text

.PHONY: text docs

text:
	./generate_text.py userManual.html

docs:
	java -jar jsrun.jar app/run.js -a -t=templates/jsdoc ../PrairieDraw.js
