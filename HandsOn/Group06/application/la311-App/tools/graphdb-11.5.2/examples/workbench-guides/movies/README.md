# Welcome to The Movies database guide

The Movies database guide is a beginner's guide showing repository creation, importing RDF data from a file, starting to explore data from the class hierarchy, some SPARQL queries and exploring RDF with the tabular view. It takes approximately 30 minutes to complete.

This file describes the same steps as executing the visual guide. You can use it to execute some of the steps at your own pace.

# Create repository

The following steps show how to use the **Repositories** view to create a repository.

The Repositories view is used to create, modify and delete repositories and connections to remote GraphDB instances (also known as remote locations).

1. Click on the **Setup** menu.
2. Click on the **Repositories** menu.
3. Click on the **Create new repository** button.
4. Click on the **GraphDB Repository** button.
5. Enter repository ID: **movies.**
6. Click on the **Create** button.

# Connect to repository

1. Click on the repository selection dropdown.
2. Click on the **movies** repository button.

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
2. Click on the **Upload RDF files** button and choose a file with the name **movies.ttl**.
3. Click on the **Import** button in the file list.
4. Click on the **Import** button in the import dialog that appears.
5. Wait until import finished.

# Explore the class hierarchy

The following steps show how to use the **Class hierarchy** view to inspect the class hierarchy and gain an insight on what the dataset contains.

The Class hierarchy view shows the hierarchy of RDF classes by the number of instances. The biggest circles are the parent classes, and the smaller nested ones are their subclasses. Hover over a given class to see its subclasses or zoom in a nested circle (RDF class) for further exploration.

1. Click on the **Explore** menu.
2. Click on the **Class hierarchy** menu.

The biggest circle shows all top-level classes. Every class may have subclasses shown as smaller circles within their parent class. The size of each circle indicates the proportion of RDF resources that belong to that class. Thus, bigger circles are classes that have more instances.

In this dataset, there is a single top-level class, **schema:Movie**, and two subclasses (the smaller circles inside). This tells us that the dataset has to do with movies.

The class **schema:Movie** is a parent class that has subclasses. Zoom inside to have a better view by scrolling up with the mouse inside the circle.

The two subclasses, **imdb:BlackandWhiteMovie** and **imdb:ColorMovie**, tell us that the movies are divided into black-and-white and color ones, and there are more color movies than black-and-white ones since the **imdb:ColorMovie** circle is larger.

## Class hierarchy instances

Click on **imdb:ColorMovie** to show its instances.

The side panel shows the first 1,000 instances of the clicked class, **imdb:ColorMovie**.

In the list you can see:
* **imdb:title/Superman** is an instance of the class **imdb:ColorMovie**.
* **imdb:title/Mulan** is an instance of the class **imdb:ColorMovie**.

### Viewing all instances with SPARQL

The link "View all..." shows the number of instances for the selected class, **imdb:ColorMovie**. Click on the link to open the SPARQL editor with a preloaded query that selects all instances.

This SPARQL query selects all instances of the class **imdb:ColorMovie**. The query was entered automatically when you clicked on the view instances link.

The table shows the results. Note that in this particular case, the query was executed automatically.

Do not worry -- there will be a dedicated section on the SPARQL editor later in the guide.

You can close the panel by clicking on the X icon.

# Execute SPARQL query

The following steps show how to use the **SPARQL Query & Update** view to execute queries.

The SPARQL Query & Update view is a unified editor for queries and updates. Enter any SPARQL query or update and click Run to execute it. The view also allows you to save queries for future retrieval and execution in the SPARQL editor.

Click on the **SPARQL** menu.

## Query 1

Enter the following SPARQL query:

```sparql
PREFIX imdb: <http://academy.ontotext.com/imdb/>

SELECT * {
   imdb:title\/PiratesoftheCaribbeanAtWorldsEnd ?p ?o .
}
```

The query selects RDF statements whose _subject_ is the movie **Pirates of the Caribbean At World's End** (identified by the IRI **imdb:title/PiratesoftheCaribbeanAtWorldsEnd**). Note that we need to escape the / in the shortened IRI.

Click on the **Run** button.

The table shows the results from executing the query.

The variables **?p** and **?o** correspond to the _predicate_ and _object_ of the RDF statements. We can see that the director (via the predicate **schema:director**) is identified by the IRI **imdb:person/GoreVerbinski** (scroll down if necessary).

## Query 2

Enter the following SPARQL query:

```sparql
PREFIX imdb: <http://academy.ontotext.com/imdb/>
PREFIX schema: <http://schema.org/>

SELECT * { 
   ?movie a imdb:ColorMovie ;
          schema:name ?movieName ;
          schema:commentCount ?commentCount .
} ORDER BY DESC(?commentCount)
```

The query selects all color movies by class (**a** is a shorthand notation for **rdf:type**) and then performs two joins to fetch the movie's name (via the **schema:name** predicate), and the movie's number of comments (via the **schema:commentCount** predicate). Finally, the result must be ordered by the number of comments in descending order.

Click on the **Run** button.

The table shows the results from executing the query.

The variables **?movie**, **?movieName** and **?commentCount** contain each movie's IRI, name and number of comments respectively. We can see that the movie with the most comments, **The Dark Knight Rises**, comes on top.

### Explore RDF as a table

The following steps show how to explore RDF data in tabular form without writing SPARQL queries. Click on the **imdb:title/DjangoUnchained** IRI to explore it.

The table shows RDF statements where the subject is the selected IRI, **imdb:title/DjangoUnchained**. The view can be configured to show statements where the IRI is the _subject_, _predicate_, _object_, _context_ or in any position.

You can click on any IRI in the table to navigate to it. Click on **imdb:person/QuentinTarantino**.

The table now shows RDF statements where **Quentin Tarantino** is in the subject position only.

You can configure the view to show RDF statements where the current IRI is the _subject_, _predicate_, _object_, _context_ or in any position. Click on the **all** tab.

In this way, we'll be able to see more statements related to **Quentin Tarantino**.

The table now shows RDF statements where **Quentin Tarantino** is any position, such as _subject_ or _object_.

You can always explore the same data using the **Visual graph** view. Click on the Visual graph button to try it now.

The graph shows connections between the start node, **imdb:person/QuentinTarantino**, and other nodes. Each arrow represents one or more connections (RDF statements).

Let's go back to the table now -- don't worry, the Visual graph view is covered in more detail in the **Star Wars guide**.

Most RDF statements describe **Quentin Tarantino** as the director, but he was the lead actor in **Reservoir Dogs**.

If we look carefully, we'll notice that he was not only the lead actor but also the director of **Reservoir Dogs**.

## Query 3

Let's try to find all movies where the lead actor and the director are the same person with SPARQL.

Click on the **SPARQL** menu.

Enter the following SPARQL query:

```sparql
PREFIX schema: <http://schema.org/>
PREFIX imdb: <http://academy.ontotext.com/imdb/>

SELECT * { 
    ?movie schema:director ?person ;
           imdb:leadActor ?person .
} ORDER BY ?person
```

The query selects RDF statements that have the same _subject_ (**?movie**) and the same _object_ (**?person**). For any given movie and person, there must be RDF statements that link the movie and the person with both the **schema:director** and the **imdb:leadActor** _predicate_.

Click on the **Run** button.

The table shows the results from executing the query.

The results show the movies and persons where the same person is both a leading actor and a director. The results are ordered by the person since we specified **ORDER BY ?person**. We can easily see that **Clint Eastwood** has made a lot of movies like that (scroll down if needed).

## Query 4

Enter the following SPARQL query:

```sparql
PREFIX schema: <http://schema.org/>
PREFIX imdb: <http://academy.ontotext.com/imdb/>

SELECT ?person (COUNT(?movie) as ?numMovies) { 
    ?movie schema:director ?person ;
           imdb:leadActor ?person .
} GROUP BY ?person ORDER BY DESC(?numMovies)
```

Just like the previous query, we select movies and people that are both the leading actor and the director. In this query, we also use **GROUP BY ?person** to group the results by person and **COUNT(?movie)** to count how many movies per person satisfy the criteria. The count is returned in the **?numMovies** variable.

Click on the **Run** button.

The table shows the results from executing the query.

Since we also used **ORDER BY DESC(?numMovies)** to order the results by movie count in descending order, we can easily see that both **Clint Eastwood** and **Woody Allen** made 10 movies where they were the leading actor and the director.
