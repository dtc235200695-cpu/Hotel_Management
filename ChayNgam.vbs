Set WshShell = CreateObject("WScript.Shell")
' Chay may chu HotelCloud hoan toan an trong nen (0 = Hidden Window)
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c npm run dev", 0, False
