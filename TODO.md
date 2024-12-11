## Bug fixes

- [x] Delete && Backspace key deletes the selected object while editing text
- [x] Shift + dragging does not change the aspect ratio while resizing
- [x] changing blur resets other image adjustments
- [x] if you add an item, then delete it, page should auto refresh. (check console for error)
- [x] CSP causes the login success page to not auto close, and also not load styles.
- [x] If you delete an image, then add it again, it doesn't show up.
- [x] If you select multiple objects with shift, then delete, it does nothing.
- [x] Marketplace cannot search for items that have not been loaded yet by infinite scrolling (@nam can you add shit ton of items so i can test this thx)
- [x] Marketplace gliching after adding new item
- [x] reordering does not work inside a group
- [x] undo and redo state do not update on the layers panel sometimes
- [x] undo/redo broken for crop since it makes multiple layers
- [x] deleting is slightly broken in admin panel, works but causes an error. sometimes?
- [x] prevent upscaling of images
- [ ] If I Copy paste something on the canvas, and then after that I copy an image in my clipboard, Ctrl + V shows copied elements instead of image. (Give clipboard priority)
- [ ] undoing on a group, removes the group 💀
- [ ] On editing a text, and then clicking modify, the content of text changes to whatever is in textOptions.text. Possible bugfix is to update the textOptions.text while the user is editing the text on canvas.

### High Priotity

- [x] EXTREMELY HIGH PRIORITY: MOVE ALL EDITOR SETTINGS LIKE TEXT SETTINGS INTO ITS OWN CONTEXT
- [ ] Make keyboard bindings a hook i guess because i need to run hooks inside it
- [ ] svg support (main issue is with cropping, and properly displaying error messages such as "svg is not supported" or similar when the backend returns an error)
- [ ] Move the selfhosted s3 to a faster server, setup caching over on cloudflare as well
- [x] speed up s3 fetching, implement heavy caching
- [x] dont serve images at full quality from s3, serve compressed versions by adding handlers in backend to resize
- [ ] Make canvas infinite scrollable (middle mouse to pan)
- [ ] Segment things ai boom wow magick thing which splits a single image into a group of images
- [ ] Maybe try using the segment thing to select stuff to REMOVE from the picutre (ie also adding some fill)
- [ ] Being able to add rectangles (color configurable)
- [ ] Eraser tool (can be used to remove inconsistencies from the removed background)
- [x] (!!) Editing paramaters of already existing texts
- [ ] Snapping selections and moving wrt to edges of neighbouring elements
- [ ] Options to export by png,jpg,webp,json (can be imported)
- [ ] (!!) Bunch of options just above the selected item (move front, move back, delete, remove background, for text put in bold, underline, italics)
- [ ] FREE HAND DRAWING
- [ ] Just put a lot of items in market place (assigned to nam)
- [ ] Warping Images and Groups // https://codesandbox.io/p/sandbox/image-distort-filter-for-fabric-qjbcl?file=%2Fsrc%2Ffilter.js%3A4%2C1
- [x] update ALL MODELS to use UUIDs, and not routes like `/api/marketplace/items/1` (switch out the 1 for the uuid)
- [x] litestream for sqlite db (for backup)
- [x] switch out filenames for uuids for marketplace and nobg
- [x] make all routes compatible with s3, some are still using local. mainly marketplace/admin
- [x] cleanup expired nobg files from s3
- [x] keybinds for undo redo
- [x] Change default export behavior to not export the entire canvas, just the objects, even if they are not selected.
- [x] (!!) Undo and Redo functions // https://github.com/fabricjs/fabric.js/issues/10011
- [x] Keybinds
- [x] Zoom
- [x] Do not dump all items in marketplace, infinite scrolling 9 at a time
- [x] Copy and Paste Elements
- [x] Use https://casesandberg.github.io/react-color/ for selecting colors to allow for selecting transparent colors
- [x] Bookmarks for decorations, as in they appear in top seperately. user made are auto bookmarked
- [x] Just rate limit the rembg thing for now
- [x] Background Color to text
- [x] Host it
- [x] refactor rembg to be a separate service, as it increases build time exponentially

### Low Priority

- [ ] text panel doesn't render properly on low res screens (768p)
- [ ] Need a better/faster background removing thing
- [ ] Go over API rate limits properly
- [ ] Deploy on push with CI/CD
- [ ] Proper healthchecks for all services
- [ ] when adding an item, the preview makes the add item button move down, so you have to scroll. bad UX. fix by making preview smaller?
- [ ] use .JSON files to save into local device (inbuilt function iirc)
- [ ] import files and restore state
- [ ] Paid Plan
  - [ ] AS a paid plan we can maybe save user files on our end
  - [ ] Use some llm to plug two image of pfp and apparel together
  - [ ] more limit on using the remove bg thing
- [ ] HUGE IF REAL
  - [ ] GIF SUPPORT // https://stackoverflow.com/questions/28056636/animated-gif-on-fabric-js-canvas | https://github.com/fabricjs/fabric.js/issues/560#issuecomment-686191184 | https://www.youtube.com/watch?v=DwnvQVhV9ho
  - [ ] Tiling mode: select a thing, select tile mode, resize the thing and it creates a tiling mode.
- [ ] Leaderboard - most no of images exported (idk)
- [ ] Optimise the sliders // not an issue on most pcs, but still
