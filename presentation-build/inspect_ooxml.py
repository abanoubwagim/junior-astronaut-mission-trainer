import json
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

deck_path = sys.argv[1]
ns = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
with zipfile.ZipFile(deck_path) as deck:
    names = deck.namelist()
    slides = [name for name in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)]
    notes = [name for name in names if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", name)]
    rels_xml = ET.fromstring(deck.read("ppt/slides/_rels/slide14.xml.rels"))
    external_links = [
        rel.attrib["Target"]
        for rel in rels_xml.findall("r:Relationship", ns)
        if rel.attrib.get("TargetMode") == "External"
    ]
    note_xml = ET.fromstring(deck.read("ppt/notesSlides/notesSlide14.xml"))
    note_text = " ".join(node.text or "" for node in note_xml.iter())
    print(json.dumps({
        "slide_count": len(slides),
        "notes_count": len(notes),
        "slide14_external_links": external_links,
        "slide14_notes_url_count": len(re.findall(r"https?://", note_text)),
        "slide14_notes_mentions_all_sources": all(
            marker in note_text for marker in ["20240003496", "water-recovery-milestone", "advanced-plant-habitat", "environmental-control", "space-radiation-at-the-moon", "weather-on-the-moon"]
        ),
    }, indent=2))
