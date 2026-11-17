@echo off

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

set _cmdLine=
set _mainClass=com.ontotext.trree.util.convert.storage.StorageTool
set _toolCommands=scan rebuild spool repair replace export help
set _cmdLineArg=

set _skipNext=
for /L %%i in (1,1,%argCount%) do (
    set "_arg=!argArray[%%i]!"
    set "_nextArg=!nextArgArray[%%i]!"

    if "!_skipNext!" == "yes" (
        :: Skip this argument as it was appended to previous argument
        set _skipNext=
    ) else (
        set _minusDorX=
        if "!_arg:~0,2!" == "-D" (
            set _minusDorX=yes
        ) else if "!_arg:~0,2!" == "-X" (
            set _minusDorX=yes
        )
        if "!_minusDorX!" == "yes" (
            :: Handle the case where -Dfoo=bar or -Xfoo=bar is mangled by cmd.exe into two parameters "-Dfoo" and "bar"
            if %%i lss %argCount% (
                if "!_nextArg:~0,1!" neq "-" (
					set _isCommand=false
					for %%j in (%_toolCommands%) do (
						if "!_nextArg!" equ "%%j" (
							set _isCommand=true
						)
					)
					if "!_isCommand!" neq "true" (
						set "_arg=!_arg!=!_nextArg!"
						set _skipNext=yes
					)
                )
            )
			if "!_arg!" neq "" (
				set "_cmdLine=!_cmdLine! ^"!_arg!^""
			)
        ) else (
			if "!_arg!" neq "" (
				set "_cmdLineArg=!_cmdLineArg! ^"!_arg!^""
			)
		)
    )
)

"%JAVA%" %JAVA_OPTS% %GDB_JAVA_OPTS% -Dgraphdb.dist="%GDB_DIST%" -cp "%GDB_CLASSPATH%" !_cmdLine! !_mainClass! !_cmdLineArg! < nul
