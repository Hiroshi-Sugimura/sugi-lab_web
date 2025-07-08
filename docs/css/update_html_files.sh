#!/bin/bash

# HTMLファイルに mobile-nav.css を追加するスクリプト

FILES=(
    "smarthome.htm"
    "timeseries.htm"
    "forms.htm"
    "papers.htm"
    "access.htm"
    "links.htm"
    "profile_e.htm"
    "smarthome_e.htm"
    "timeseries_e.htm"
    "papers_e.htm"
    "access_e.htm"
    "links_e.htm"
    "privacyPolicy_ELController.htm"
    "privacyPolicy_ELLighting.htm"
    "privacyPolicy_ELAircleaner.htm"
    "privacyPolicy_ELBlind.htm"
    "privacyPolicy_ELRangehood.htm"
    "index_e.html"
)

for file in "${FILES[@]}"; do
    if [ -f "../$file" ]; then
        echo "Updating $file..."
        sed -i '' 's|<link rel="stylesheet" href="css/responsive.css" type="text/css">|<link rel="stylesheet" href="css/responsive.css" type="text/css">\
    <link rel="stylesheet" href="css/mobile-nav.css" type="text/css">|' "../$file"
    else
        echo "File $file not found, skipping..."
    fi
done

echo "All files updated!"
