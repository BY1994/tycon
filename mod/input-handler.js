const TestConfig = require("./test-config.js")
const TestData = require("./test-data.js")
const EntryHandler = require("./entry-handler.js")
const SystemWordHandler = require("./system-word-handler.js")
const ColourManager = require("./colour-manager.js")
const Out = require("./out.js")

module.exports = function(ch, key) {

	if (key != undefined) {

		// CTRL + C    Quit
		if (key.sequence === "\u0003") {
			StateMgr.f.quit()
		}

		// CTRL + R    Start / restart
		else if (key.sequence === "\u0012") {
			StateMgr.f.waiting()
		}

		// CTRL + A    Menu
		else if (key.sequence === "\u0001") {
			StateMgr.f.menu()
		}

		// Alpha key input for typing, space/return entry, and backspace
		else if (!/[^a-zA-Z]/.test(key.name) && TestConfig.store.test.reject.indexOf(key.name) < 0) {

			// Don't respond if test is over
			if (StateMgr.now === "running" && TestData.store.system.time.remaining > 0) {

				// Space
				if (key.name === "space" || key.name === "return") {

					// Contains non-whitespace characters
					// This is to prevent space or enter from registering as an incorrect word
					if (/\S/.test(TestData.store.user.current)) {

						// Reference stat output here to keep simpler in cases below
						let stat = function() {
							Out.stats()
						}

						// Correct word. Move to next
						if (TestData.store.user.current === TestData.store.system.wordSet[0]) {
							stat()
							TestData.store.user.stats.correct++
							Out.user.clear()
							EntryHandler.f.clear()
							SystemWordHandler.f.next()
							ColourManager.f.good()
							Out.system.words()
						}

						// Incorrect word
						else {

							TestData.store.user.stats.incorrect++

							// Correct word not required. Log incorrect, and move to next word							
							if (!TestConfig.store.test.requireCorrect) {
								stat()
								Out.user.clear()
								EntryHandler.f.clear()
								SystemWordHandler.f.next()
								ColourManager.f.good()
								Out.system.words()
							}

							// Correct word is required before moving to next word.
							// Stay on current word, and re-print out stats, system set, and user text
							else {
								stat()
								Out.system.current()
								Out.user.rewrite()
							}

						}
						
					}

				}

				// (NOTE) windows solution not working in git shellz
				// Backspace
				// Windows shows Backspace as { sequence: "\b" }
				// Unix shows Ctrl + Backspace as { sequence: "\b", ctrl: false }
				// ...so we have to handle strangely below 
				else if (key.name === "backspace") {

					Out.stats()

					let pt = process.platform
					// Function for regular Backspace
					function rb() {
						let current = TestData.store.user.current
						TestData.store.user.current = current.substring(0, current.length - 1)
						// EntryHandler.f.check()
						// if (TestData.store.user.current === "") {
						// 	ColourManager.f.good()
						// }
					}
					// Function for Ctrl + Backspace
					function cb() {
						EntryHandler.f.clear()
					}

					// (NOTE) Should check for CTRL+W for the unixers ;v

					// Unix
					if (pt === "linux" || pt === "darwin") {
						key.sequence === "\b" ? cb() : rb()
					}
					// Windows
					else if (pt === "win32") {
						key.sequence === "\b" ? rb() : cb()
					}
					// Other platform (??)
					else {
						rb()
					}

					// Log backspace
					TestData.store.user.stats.backspace++

					// Check user text, print (format & style) system text, print user text
					// Don't user EntryHandler.f.process() b/c  that would print "backspace"
					EntryHandler.f.check()
					Out.system.current()
					Out.user.rewrite()

				}

				// Regular typing
				else {

					Out.stats()
					EntryHandler.f.proc(key)
					Out.system.current()
					Out.user.letter()

				}

			}

			// Test is waiting for first keypress to begin, when timer is started
			else if (StateMgr.now === "waiting") {

				// Don't print or respond to SPACE or RETURN
				// ...Can't use these in TestConfig.store.test.reject because they're used for word entry
				if (key.name != "space" && key.name != "return") {

					// Output stats (clears console)
					Out.clear()
					Out.stats()

					// Begin
					StateMgr.f.run()

					EntryHandler.f.proc(key)
					Out.system.words()
					Out.user.letter()
					
				}

			}

		} // [End] Alpha input if statement

	} // [End] if(!undefined)

}

const StateMgr = require("./state-manager.js")