## Bug fixes

- [x] Delete && Backspace key deletes the selected object while editing text
- [x] Shift + dragging does not change the aspect ratio while resizing
- [x] changing blur resets other image adjustments
- [x] if you add an item, then delete it, page should auto refresh. (check console for error)
- [x] CSP causes the login success page to not auto close, and also not load styles.
- [ ] If I Copy paste something on the canvas, and then after that I copy an image in my clipboard, Ctrl + V shows copied elements instead of image. (Give clipboard priority)

### High Priotity

- [ ] Change default export behavior to not export the entire canvas, just the objects, even if they are not selected.
- [ ] (!!) Undo and Redo functions // https://github.com/fabricjs/fabric.js/issues/10011
- [x] Keybinds
- [ ] Being able to add rectangles (color configurable)
- [x] Do not dump all items in marketplace, infinite scrolling 9 at a time
- [x] Copy and Paste Elements
- [ ] Eraser tool (can be used to remove inconsistencies from the removed background)
- [ ] Editing paramaters of already existing texts
- [ ] Snapping selections and moving wrt to edges of neighbouring elements
- [x] Bookmarks for decorations, as in they appear in top seperately. user made are auto bookmarked
- [ ] Options to export by png,jpg,webp,json (can be imported)
- [ ] Bunch of options just above the selected item (move front, move back, delete, remove background, for text put in bold, underline, italics)
- [x] Just rate limit the rembg thing for now
- [x] Background Color to text
- [x] Host it
- [x] refactor rembg to be a separate service, as it increases build time exponentially
- [ ] Just put a lot of items in market place (assigned to nam)

### Low Priority

- [ ] Go over API rate limits properly
- [ ] when adding an item, the preview makes the add item button move down, so you have to scroll. bad UX. fix by making preview smaller?
- [ ] write a good compression function, compress images when uploading and save directly compressed image. // temp fix: limited size to 1mb
- [ ] Use https://casesandberg.github.io/react-color/ for selecting colors to allow for selecting transparent colors
- [ ] use .JSON files to save into local device (inbuilt function iirc)
- [ ] import files and restore state
- [ ] Paid Plan
  - [ ] AS a paid plan we can maybe save user files on our end
  - [ ] Use some llm to plug two image of pfp and apparel together
  - [ ] more limit on using the remove bg thing
- [ ] HUGE IF REAL
  - [ ] GIF SUPPORT // https://stackoverflow.com/questions/28056636/animated-gif-on-fabric-js-canvas | https://github.com/fabricjs/fabric.js/issues/560#issuecomment-686191184 | https://www.youtube.com/watch?v=DwnvQVhV9ho
  - [ ] FREE HAND DRAWING
  - [ ] Tiling mode: select a thing, select tile mode, resize the thing and it creates a tiling mode.
- [ ] Leaderboard - most no of images exported (idk)
- [ ] Optimise the sliders // not an issue on most pcs, but still
