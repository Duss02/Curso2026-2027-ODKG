@echo off

:: script must be used with setlocal enabledelayedexpansion

:: Set GraphDB dist directory
set SCRIPT=%~dp0
for %%I in ("%SCRIPT%..") do set "GDB_DIST=%%~dpfI"

:: Find java.exe
if exist "%GDB_DIST%\jdk\" (
    :: Our bundled JDK
    set "JAVA=%GDB_DIST%\jdk\bin\java.exe"
) else (
    :: Java from JAVA_HOME or path
    if "%JAVA_HOME%" == "" (
        :: If JAVA_HOME isn't set look for java.exe in the PATH
        for %%I in (java.exe) do set "JAVA=%%~$PATH:I"
        if '!JAVA!' == '' (
            echo Could not find any executable java binary. Please install java in your PATH or set JAVA_HOME.
            exit /b 1
        )
    ) else (
        :: Use java.exe from JAVA_HOME
        set "JAVA=%JAVA_HOME%\bin\java.exe"
    )
)

:: Normalize JAVA path to use backslashes
set JAVA=%JAVA:/=\%

:: Supported Java versions
set SUPPORTED_JAVA_VERSION=21

set JAVA_VERSION=0

set "JAVA_VERSION_RAW="
set "FOUND_VERSION=false"

:: Loop through every line of the java -version output
:: Check if the line starts with "openjdk version" OR "java version"
for /f "delims=" %%a in ('"%JAVA%" -version 2^>^&1') do (
    echo %%a | findstr /i /c:"openjdk version" >nul
    if %errorlevel%==0 (
        set "JAVA_VERSION_RAW=%%a"
        set "FOUND_VERSION=true"
        goto :FoundIt
    )

    echo %%a | findstr /i /c:"java version" >nul
    if %errorlevel%==0 (
        set "JAVA_VERSION_RAW=%%a"
        set "FOUND_VERSION=true"
        goto :FoundIt
    )
)

if "%FOUND_VERSION%"=="false" (
    echo ERROR: Could not detect Java version. Output did not contain 'openjdk version' or 'java version'.
    echo Raw output was:
    "%JAVA%" -version 2>&1
    exit /b 1
)

:FoundIt

:: Extract the version string
set "JAVA_VERSION="
for /f "tokens=3" %%g in ("%JAVA_VERSION_RAW%") do (
    set "JAVA_VERSION=%%g"
)

set JAVA_VERSION=%JAVA_VERSION:"=%

:: Extract major version number (handle 1.8, and 17, 21...)
for /f "delims=.-_ tokens=1-2" %%v in ("%JAVA_VERSION%") do (
    if /I "%%v" EQU "1" (
        set "JAVA_VERSION=%%w"
    ) else (
        set "JAVA_VERSION=%%v"
    )
)

set _is_supported=false
for %%v in (%SUPPORTED_JAVA_VERSIONS%) do (
    if /i %JAVA_VERSION% equ %%v (
        set _is_supported=true
    )
    set _last_version=%%v
)

if %JAVA_VERSION% LSS %SUPPORTED_JAVA_VERSION% (
    echo This GraphDB distribution requires Java !SUPPORTED_JAVA_VERSION! or greater but you have Java !JAVA_VERSION!
    exit /b 1
)

:: Empty default for version specific options
set JAVA_VERSION_OPTS=

:: Include Java exports for Java 9+
set JAVA_VERSION_OPTS=%JAVA_VERSION_OPTS% --add-exports jdk.management.agent/jdk.internal.agent=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED --enable-native-access=ALL-UNNAMED

:: By default the -XX:MaxDirectMemorySize is limited to the heap size
if NOT "%GDB_JAVA_32BIT%" == "true" (
	set JAVA_VERSION_OPTS=%JAVA_VERSION_OPTS% -XX:MaxDirectMemorySize=128G
)

set "GDB_CLASSPATH=%GDB_DIST%\lib\*"

call "%~dp0\graphdb.in.cmd" || exit /b 1
call "%~dp0\env-vars.in.cmd" || exit /b 1
