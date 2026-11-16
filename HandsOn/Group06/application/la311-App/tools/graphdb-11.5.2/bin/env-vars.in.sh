#!/usr/bin/env bash

# This scripts collects all environment variables beginning with graphdb and prepares them as Java system options
# in the common JAVA_OPTS_ARRAY variable. This allows to override separate GraphDB configurations via the environment.
#
# The script supports the following formats for variable names:
#   graphdb.property       - does no processing, it preserves the dots
#   graphdb_property       - does no processing, it preserves the underscores
#   graphdb__property      - converts each __ to a ., i.e. graphdb__property becomes graphdb.property
#   graphdb___property     - converts each ___ to a -, i.e. graphdb___property becomes graphdb-property
#
# Variables may also start with a "_graphdb" prefix (e.g. for environments/secret stores that
# don't allow dots in variable names). This prefix is stripped, and the remainder
# is converted using the same rules above, e.g.:
#   _graphdb_property      - becomes property
#   _graphdb__foo__bar     - becomes foo.bar
#   _graphdb___foo___bar   - becomes foo-bar

for variable in $(env | grep -E "^(graphdb|_graphdb)" | cut -d '=' -f 1); do
  PROP_KEY=$variable
  PROP_VAL=$(printenv "${variable}")

  # Strip the _graphdb prefix if present
  PROP_KEY="${PROP_KEY#_graphdb}"

  # Converts triple _ to a -
  PROP_KEY="${PROP_KEY//___/-}"
  # Converts double _ to a .
  PROP_KEY="${PROP_KEY//__/.}"

  # Remove any leftover leading separator caused by stripping the _graphdb prefix
  # (e.g. "_graphdb__property" -> ".property" -> "property")
  PROP_KEY="${PROP_KEY#[_.-]}"

  # Converts resolved configurations as Java system properties
  JAVA_OPTS_ARRAY+=("-D${PROP_KEY}=${PROP_VAL}")
done