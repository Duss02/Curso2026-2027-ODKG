# Welcome to The Star Wars guide

The Star Wars guide is a beginner's guide showing repository creation, importing RDF data from a file, starting to explore data from the visual graph, and executing SPARQL queries. The guide takes approximately 30 minutes to complete.

This file describes the same steps as executing the visual guide. You can use it to execute some of the steps at your own pace.

# Create repository

The following steps show how to use the **Repositories** view to create a repository.

The Repositories view is used to create, modify and delete repositories and connections to remote GraphDB instances (also known as remote locations).

1. Click on the **Setup** menu.
2. Click on the **Repositories** menu.
3. Click on the **Create new repository** button.
4. Click on the **GraphDB Repository** button.
5. Enter repository ID: **starwars.**
6. Click on the **Create** button.

# Connect to repository

1. Click on the repository selection dropdown.
2. Click on the **starwars** repository button.

# Enable autocomplete

The following steps show how to use the **Autocomplete index** view to enable the autocomplete index.

The Autocomplete index is used for automatic completion of IRIs in the SPARQL editor and the View resource page. Use this view to enable or disable the index and check its status.

1. Click on the **Setup** menu.
2. Click on the **Autocomplete** menu.
3. Click on the checkbox to enable the index.
4. Wait until indexing finished.

# Import file

The following steps show how to use the **Import** view to import data from a file.

The Import view allows you to import RDF data into a GraphDB repository. Import data from local files, from files on the server where GraphDB is running, from a remote URL, or by pasting the RDF data as a text snippet. Each import method supports various RDF serialisation formats.

1. Click on the **Import** menu.
2. Click on the **Upload RDF files** button and choose a file with the name **starwars.ttl**.
3. Click on the **Import** button in the file list.
4. Click on the **Import** button in the import dialog that appears.
5. Wait until import finished.

# Visual graph explore

The following steps show how to use the **Visual graph** view to explore data in a visual manner.

The Visual graph view provides a visual representation of parts of the RDF graph. The visualisation starts from a single resource and the resources connected to it or from a graph query result. Double-click on resources to expand the graph with their connections.

1. Click on the **Explore** menu.
2. Click on the **Visual graph** menu.
3. Enter **lu** in the **Easy graph** text input.
4. Click on the **https://swapi.co/resource/human/1** IRI to show the visual graph.

The graph shows connections between the start node, **Luke Skywalker**, and other nodes. Each arrow represents one or more connections (RDF statements).

## Visual graph nodes and links

A circle represents an RDF resource. In this case, **Luke Skywalker**.

An arrow with a label represents one or more links between nodes. In this case, the arrow shows the relation **Luke Skywalker -> type -> Character**.

This tells us that one of the RDF types for **Luke Skywalker** is **Character**.

**Mammal** is another RDF type for **Luke Skywalker**.

This connection tells us that **Luke Skywalker** has a **vehicle** called **Snowspeeder**. In addition, it shows the reverse relation **pilot**, which links **Snowspeeder** to **Luke Skywalker**.

**Luke Skywalker** has another **vehicle** called **Imperial Speeder Bike**. Again, the reverse relation **pilot** links **Imperial Speeder Bike** to **Luke Skywalker**.

# Visual graph properties

Click on **A New Hope** to show its properties.

The side panel shows the properties of the clicked node, **A New Hope**.

**Types** shows all the RDF types for **A New Hope**.

We can see that **A New Hope** has a single type, **voc:Film**.

The values for generic properties like **voc:releaseDate** are listed in dedicated sections. The value shows the actual release date of **A New Hope**.

The property **voc:episodeId** tells us that **A New Hope** was envisioned as the 4th movie in the series, even though it was the first to be released in 1977.

You can close the panel by clicking on the X icon.

# Visual graph: expand node

Double click on **A New Hope** to expand the graph.

Node expansion enriches the graph by showing nodes connected to the expanded node, such as the character **C-3PO**.
The planet **Tatooine**, which was already shown before expanding, is now linked to both **Luke Skywalker** and **A New Hope**.

# Execute SPARQL query

The following steps show how to use the **SPARQL Query & Update** view to execute queries.

The SPARQL Query & Update view is a unified editor for queries and updates. Enter any SPARQL query or update and click Run to execute it. The view also allows you to save queries for future retrieval and execution in the SPARQL editor.

Click on the **SPARQL** menu.

## Query 1

Enter the following SPARQL query:

```sparql
SELECT * {
    <https://swapi.co/resource/human/1> ?p ?o
}
```

The query selects RDF statements whose _subject_ is **Luke Skywalker** (identified by the IRI **https://swapi.co/resource/human/1**).

Click on the **Run** button.

The table shows the results from executing the query.

The variables **?p** and **?o** correspond to the _predicate_ and _object_ of the RDF statements.

## Query 2

Enter the following SPARQL query:

```sparql
PREFIX voc: <https://swapi.co/vocabulary/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT * {
    <https://swapi.co/resource/human/1> voc:film ?movie .
    ?movie rdfs:label ?movieName .
}
```

The query selects all movies where **Luke Skywalker** is one of the characters and illustrates the simplest SPARQL join, using the same variable **?movie** in two different statement patterns.

Click on the **Run** button.

The table shows the results from executing the query.

The variables **?movie** and **?movieName** contain each movie's IRI and name respectively.

## Query 3

Enter the following SPARQL query:

```sparql
PREFIX voc: <https://swapi.co/vocabulary/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT * {
    <https://swapi.co/resource/human/1> voc:film ?movie .
    ?movie rdfs:label ?movieName ;
           voc:releaseDate ?movieReleaseDate .
} ORDER BY ?movieReleaseDate
```

The query builds upon the previous query but adds an additional join to fetch each movie's release date, and also sorting the results by the release date.

Click on the **Run** button.

The table shows the results from executing the query.

The new variable **?movieReleaseDate** contains the release date and the results are sorted by it. We can clearly see that **A New Hope** was released first.

