@echo off

:: OPTIONS:
:: Usage: cluster-proxy [-h] [-r <num>] [-g <address>] [-p <file>] [-Dprop] [-Xprop]
:: Start a cluster proxy.
::   -p, --pid-file <file>           write PID to <file>
::   -h, --help                      print command line options
::   -r, --follower-retries <num>    number of times a request to be retried to a
::                                     different node in the cluster
::   -g, --graphdb-hosts <address>   list of GraphDB nodes HTTP or RPC address
::                                     that are part of a cluster
::   -Dprop                          set Java system property
::   -Xprop                          set non-standard Java system property
:: CONTROLLING STARTUP:
::
:: You can use these environment variables to control some options:
::
::    GDB_JAVA_OPTS      - Sets additional Java options (-D or -X)
::    GDB_JAVA_32BIT     - Configures (if set to true) GraphDB to run on 32bit Java
::    GDB_MIN_MEM        - Sets the Java minimum heap size (-Xms option).
::    GDB_MAX_MEM        - Sets the Java maximum heap size (-Xmx option).
::    GDB_HEAP_SIZE      - Sets the Java minimum and maximum heap size (-Xms and -Xmx option).
::                         Overrides both GDB_MIN_MEM and GDB_MAX_MEM.
::                         Recommended if you need to specify the heap size.
::    GDB_HEAP_NEWSIZE   - Sets the initial and maximum heap size for the young generation (-Xmn option).
::    GDB_GC_LOG         - Enables (if set to true) the logging of Java garbage collection.
::                         The log will be written to gc-<pid>.log in the distribution directory,
::                         unless GDB_GC_LOG_FILE is set to a custom file.
::    GDB_GC_LOG_FILE    - Specifies a custom file for GC logging.


setlocal enabledelayedexpansion

call "%~dp0"\setvars.in.cmd || exit /b 1

:: Stores each argument into two 1-based arrays, argArray and nextArgArray, where nextArgArray is shifted to the left.
:: Each argument is stripped of any surrounding double quotes.
set argCount=0
for %%x in (%*) do (
    set /A argCount+=1
    set "argArray[!argCount!]=%%~x"
    if !argCount! gtr 1 (
        set /A argCount2=argCount-1
        set "nextArgArray[!argCount2!]=%%~x"
    )
)

set _cmdLine="-Dgraphdb.foreground=yes"
set _hosts=
set _lastPrefix=
set _skipNext=
for /L %%i in (1,1,%argCount%) do (
    set "_arg=!argArray[%%i]!"
    set "_nextArg=!nextArgArray[%%i]!"

    if "!_skipNext!" == "yes" (
        :: Skip this argument as it was appended to previous argument
        set _skipNext=
    ) else (
        if "!_arg!" == "-h" (
            call :Usage
            exit /b 1
        )
		if "!_arg!" == "--help" (
            call :Usage
            exit /b 1
        )
		if "!_arg!" == "--pid-file" (
			set _arg=-p
		)
		if "!_arg!" == "--follower-retries" (
			set _arg=-r
		)
		if "!_arg!" == "--graphdb-hosts" (
			set _arg=-g
		)

        set _minusDorX=
        if "!_arg:~0,2!" == "-D" (
            set _lastPrefix=-D
            set _minusDorX=yes
        ) else if "!_arg:~0,2!" == "-X" (
            set _lastPrefix=-X
            set _minusDorX=yes
        )

        if "!_minusDorX!" == "yes" (
            :: Handle the case where -Dfoo=bar or -Xfoo=bar is mangled by cmd.exe into two parameters "-Dfoo" and "bar"
            if %%i lss %argCount% (
                if "!_nextArg:~0,1!" neq "-" (
                    set "_arg=!_arg!=!_nextArg!"
                    set _skipNext=yes
                )
            )
        ) else if "!_arg!" == "-p" (
            set _error=
            if %%i equ %argCount% (
                :: This is the last argument, i.e. no next argument/no filename
                set _error=yes
            ) else if "!_nextArg:~0,1!" == "-" (
                :: Next argument starts with -, so not a filename
                set _error=yes
            )
            if "!_error!" == "yes" (
                call :ErrorAndUsage "File missing for option -p"
                exit /b 1
            ) else (
                set _lastPrefix=-p
                set "_arg=-Dgraphdb.pidfile=!_nextArg!"
                set _skipNext=yes
            )
        ) else if "!_arg!" == "-r" (
            set _error=
            if %%i equ %argCount% (
                :: This is the last argument, i.e. no next argument/no filename
                set _error=yes
            ) else if "!_nextArg:~0,1!" == "-" (
                :: Next argument starts with -, so not a filename
                set _error=yes
            )
            if "!_error!" == "yes" (
                call :ErrorAndUsage "File missing for option -r"
                exit /b 1
            ) else (
                set _lastPrefix=-r
                set "_arg=-Dgraphdb.proxy.followerRetries=!_nextArg!"
                set _skipNext=yes
            )
        ) else if "!_arg!" == "-g" (
            set _error=
            if %%i equ %argCount% (
                :: This is the last argument, i.e. no next argument/no filename
                set _error=yes
            ) else if "!_nextArg:~0,1!" == "-" (
                :: Next argument starts with -, so not an address
                set _error=yes
            )
            if "!_error!" == "yes" (
                call :ErrorAndUsage "File missing for option -g"
                exit /b 1
            ) else (
                set _lastPrefix=-g
                set _hosts=!_hosts!!_nextArg!,
                set _skipNext=yes
                set _arg=
            )
        ) else if "!_lastPrefix!" == "-g" (
            if not "!_arg:~0,1!" == "-" (
                set _hosts=!_hosts!!_arg!,
                set _arg=
            )
        ) else (
            call :ErrorAndUsage "Invalid parameter: !_arg!"
            exit /b 1
        )

        if "!_arg!" neq "" (
            set "_cmdLine=!_cmdLine! ^"!_arg!^""
        )
    )
)

:: Add all hosts to a single property

if "!_hosts!" neq "" (
    set "_cmdLine=!_cmdLine! ^"-Dgraphdb.proxy.hosts=!_hosts!^""
)

"%JAVA%" %JAVA_OPTS% %GDB_JAVA_OPTS% -Dgraphdb.dist="%GDB_DIST%" -cp "%GDB_CLASSPATH%" !_cmdLine! com.ontotext.graphdb.server.ClusterProxyMain < nul
goto :eof

:Usage
    echo Usage: cluster-proxy [-h] [-r ^<num^>] [-g ^<address^>] [-p ^<file^>] [-Dprop] [-Xprop]
    echo Start a cluster proxy.
    echo   -p, --pid-file ^<file^>           write PID to ^<file^>
    echo   -h, --help                      print command line options
    echo   -r, --follower-retries ^<num^>    number of times a request to be retried to a
    echo                                     different node in the cluster
    echo   -g, --graphdb-hosts ^<address^>   list of GraphDB nodes' HTTP or RPC address
    echo                                     that are part of the same cluster
    echo   -Dprop                          set Java system property
    echo   -Xprop                          set non-standard Java system property
    echo:
    echo Note: to pass a double quote as part of an argument, surround the entire argument
    echo in double quotes and escape the double quote with another double quote, e.g.:
    echo:
    echo     "-Dmy.property=value-with-""-in-it" will set the property my.property to value-with-^"-in-it
    exit /b

:ErrorAndUsage
    echo %~1
    echo:
    call :Usage
    exit /b
