# fanfic-analysis

This repository is for collecting and analyzing the data from [Fanction.net](https://www.fanfiction.net), specifically about Harry Potter fan fiction.

The repository [here](https://github.com/smilli/fanfiction) served as a foundation for a lot of the scraping done here. I ended up modifying their code to suit my needs and also to parse a different subset of data, but their work was very useful for me to get started.

## notebooks
The `notebooks` folder contains some Jupyter Notebooks that explain the scraping process, as well as some initial visualizations using `pandas` with the scraped data.

## src
This folder contains the Python script used to scrape fanfiction.net. It is coded to only look for Harry Potter book fan fiction and will only look at a page every two seconds to stay within fanfiction.net's terms of service. The scraper took about 2 days to run to completion in July 2017.

## vis
This folder contains visualizations of the scraped data. They use [D3.js](https://d3js.org/) and so are in HTML/JavaScript/CSS. They can be viewed as a whole at a link that is to be provided...

## data
This is the folder with the scraped data, though not currently on GitHub since the file is a bit large. Still need to look into the best way to make this available.  
