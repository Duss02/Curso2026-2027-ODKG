@echo off

:: This scripts collects all environment variables beginning with graphdb and prepares them as Java system options
:: in the common JAVA_OPTS variable. This allows to override separate GraphDB configurations via the environment.
::
:: The processing supports the following formats for variable names:
::   graphdb.property      - does no processing, it preserves the dots
::   graphdb_property      - does no processing, it preserves the underscores
::   graphdb__property     - converts each __ to a ., i.e. graphdb__property becomes graphdb.property
::   graphdb___property    - converts each ___ to a -, i.e. graphdb___property becomes graphdb-property
::
:: Variables may also start with a "_graphdb" prefix (e.g. for environments/secret stores that
:: don't allow dots in variable names). This prefix is stripped, and the remainder
:: is converted using the same rules above, e.g.:
::   _graphdb_property      - becomes property
::   _graphdb__foo__bar     - becomes foo.bar
::   _graphdb___foo___bar   - becomes foo-bar
::
:: The script must be used with "setlocal enabledelayedexpansion"

for /f "tokens=1,* delims==" %%A in ('set') do (
    set "PROP_KEY=%%A"
    set "MATCHED="

    if "!PROP_KEY:~0,8!" == "_graphdb" (
        :: Strip the _graphdb prefix
        set "PROP_KEY=!PROP_KEY:~8!"
        set "MATCHED=1"
    ) else if "!PROP_KEY:~0,7!" == "graphdb" (
        set "MATCHED=1"
    )

    if defined MATCHED (
        set "PROP_VAL=%%B"
        :: Converts triple _ to a -
        set "PROP_KEY=!PROP_KEY:___=-!"
        :: Converts double _ to a .
        set "PROP_KEY=!PROP_KEY:__=.!"
        :: Removes a leftover leading separator caused by stripping the _graphdb prefix (e.g. "_graphdb__property" -> ".property" -> "property")
        if "!PROP_KEY:~0,1!" == "_" set "PROP_KEY=!PROP_KEY:~1!"
        if "!PROP_KEY:~0,1!" == "." set "PROP_KEY=!PROP_KEY:~1!"
        if "!PROP_KEY:~0,1!" == "-" set "PROP_KEY=!PROP_KEY:~1!"
        :: Converts " to "" in the value to be escaped back to " later
        set "PROP_VAL=!PROP_VAL:"=""!"
        :: Converts resolved configurations as Java system properties
        set JAVA_OPTS=!JAVA_OPTS! -D!PROP_KEY!="!PROP_VAL!"
    )
)