# fanfic-analysis

This repository is for collecting and analyzing the data from [Fanction.net](https://www.fanfiction.net), specifically about Harry Potter fan fiction.



## notebooks
The `notebooks` folder contains some Jupyter Notebooks that explain the scraping process, as well as some initial visualizations using `pandas` with the scraped data. There are also notebooks on cleaning the data and manipulating it into grouped CSVs, JSONs, and matrices.

## src
This folder contains the Python script used to scrape fanfiction.net. It is coded to only look for Harry Potter book fan fiction and will only look at a page every two seconds to stay within fanfiction.net's terms of service. The scraper took about 2 days to run to completion in July 2017.

## vis
This folder contains visualizations of the scraped data. They use [D3.js](https://d3js.org/) and so are in HTML/JavaScript/CSS. They can be viewed as a whole on [the site](http://allisonking.github.io/fanfic-analysis). For a more technical look, please see my [bl.ocks](https://bl.ocks.org/allisonking) page.

## data
This is the folder with parts of the scraped data. The entire data file was too large, and so this folder only contains the data after it was manipulated in Python to be only the amount necessary for each graph.
