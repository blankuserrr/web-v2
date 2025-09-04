# <span style="color: #32ae62;">How to Contribute to Terbium v2</span>
Table of Contents
- [How to Contribute to Terbium v2](#how-to-contribute-to-terbium-v2)
	- [Understanding the File Structure](#understanding-the-file-structure)
	- [Learning What should and shouldn't be touched](#learning-what-should-and-shouldnt-be-touched)
  
## <a name="understanding-the-file-structure" style="color: #32ae62;">Understanding the File Structure</a>
Terbium v2.1 for the most part is written in [SolidJS](https://www.solidjs.com/). If you haven't already make sure you have all the dependencies installed which can be done via `pnpm i` (or the package manager of your choice).

Terbium has 3 Folders that you should pay attention to and that are referenced throughout Terbium's Code.
- <span style="color: #32ae62;">src</span>: The location of the webOS's frontend code & apis Such as the `login`, `desktop`, `gui components` etc
  - <span style="color: #32ae62;">sys</span>: The location of the APIs and GUI components/styles
    - <span style="color: #32ae62;">gui</span>: The location of GUI Components
      - <span style="color: #32ae62;">styles</span>: Stylesheets for all the components
    - <span style="color: #32ae62;">liquor</span>: The location of all liquor related components and APIs
    - <span style="color: #32ae62;">apis</span>: The location of the API's code
    
- <span style="color: #32ae62;">public</span>: The static folder for normal html, js, css components such as Default Applications, Libraries, and Anura Applications & Service Workers

## <a name="learning-what-should-and-shouldnt-be-touched" style="color: #32ae62;">Learning What should and shouldn't be touched</a>

For the most part this is self explanatory. Unless you absolutely know what your doing **DO NOT** mess with anything in the `sys` folder or any typescript configuration files as they are system critical and will break things if you modify them without knowing what you're doing. If you do however know what you're doing and wish to expand upon the current functionality feel free to poke around in the `sys`.

Modifying apps in the `public` folder is fine and shouldn't break anything since it is not system dependent except for in the OOBE when it copies assets from there to the file system. If you wish to add Terminal Commands refer to [Creating Terminal Commands](./creating-terminal-commands.md)
