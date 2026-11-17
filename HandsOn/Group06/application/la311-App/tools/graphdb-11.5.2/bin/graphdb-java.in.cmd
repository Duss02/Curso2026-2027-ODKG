@echo off

setlocal enabledelayedexpansion

call "%~dp0\setvars.in.cmd" || exit /b 1

setlocal disabledelayedexpansion

:: run Java with the appropriate arguments
"%JAVA%" %JAVA_OPTS% %GDB_JAVA_OPTS% -Dgraphdb.dist="%GDB_DIST%" -cp "%GDB_CLASSPATH%" %*

endlocal
