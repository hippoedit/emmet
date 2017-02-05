/**
 * @param {Function} require
 * @param {Underscore} _
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */

//emmet.define('editorProxy', function(require, _) {
var editorProxy = {
		view : null,
		document : null,
		debug : false,
		profile : "xhtml", 

		trace: function(text, init)
		{
			if (this.debug == true)
			{
				if (init == true) Output("ZenCoding").clear();
				Output("ZenCoding").writeln(text);
			}
		},

		/**
		 * Setup underlying editor context. You should call this method 
		 * <code>before</code> using any Zen Coding action.
		 * @param {Object} context
		 */
		setupContext: function(context, debug, profile) 
		{
			this.view 		 = context;
		    this.document	 = this.view.Document;
			this.debug		 = debug;
			this.profile  	 = profile;
  		
			var TabMode  = this.document.Syntax.TabMode;
			var bUseTabs = (TabMode != 2 /*eTabModeTabsToSpaces*/ );
			if ( bUseTabs && TabMode == 0 /*eTabModeAuto*/ )
				bUseTabs = this.document.TabUsed;

			var res = emmet.require('resources');
			var utils = emmet.require('utils');
			
			var indentation = res.getVariable('indentation');

		    // get indentation characters
		    if (bUseTabs == true) {
		        indentation = '\t';
		    } else {
		        // using core zen_coding.repeatString() method to repeat string as many 
		        // times as we need: zen_coding.repeatString('a', 4) -> 'aaaa'
		        indentation = utils.repeatString(' ', this.document.IndentSize);
		    }
      
		    // setup ZC core
		    res.setVariable('indentation', indentation);
  
		    // get/set newline character
	        utils.setNewline(this.document.LineBreak);
		
			this.trace("setContext : " + this.document.Title, true);
		},
	
		/**
		 * Returns character indexes of selected text: object with <code>start</code>
		 * and <code>end</code> properties. If there's no selection, should return 
		 * object with <code>start</code> and <code>end</code> properties referring
		 * to current caret position
		 * @return {Object}
		 * @example
		 * var selection = zen_editor.getSelectionRange();
		 * alert(selection.start + ', ' + selection.end); 
		 */
		getSelectionRange: function() {
			var range = {
				start: this.document.TextToAbsolute(this.view.Selection.Start),
				end: this.document.TextToAbsolute(this.view.Selection.End)
			};
			this.trace("getSelectionRange : " + range.start + " - " + range.end);
			return range;
		},
	
		/**
		 * Creates selection from <code>start</code> to <code>end</code> character
		 * indexes. If <code>end</code> is ommited, this method should place caret 
		 * and <code>start</code> index
		 * @param {Number} start
		 * @param {Number} [end]
		 * @example
		 * zen_editor.createSelection(10, 40);
		 * 
		 * //move caret to 15th character
		 * zen_editor.createSelection(15);
		 */
		createSelection: function(start, end) {
			this.trace("createSelection : " + start + " - " + end);
			if ( typeof(end) !== 'undefined' )
			{
				start = this.document.AbsoluteToText(start);
				end = this.document.AbsoluteToText(end);
				this.view.Selection = CreateRange(start, end);
			}
			else
			{
				this.view.Position  = start; 		
			}
		},
	
		/**
		 * Returns current line's start and end indexes as object with <code>start</code>
		 * and <code>end</code> properties
		 * @return {Object}
		 * @example
		 * var range = zen_editor.getCurrentLineRange();
		 * alert(range.start + ', ' + range.end);
		 */
		getCurrentLineRange: function() {
			var nStart = this.document.TextToAbsolute(new Position(this.view.Position.Line, 0));
			var range = {
				start: nStart, 
				end: nStart + this.document.GetLineLength(this.view.Position.Line)
			};
			this.trace("getCurrentLineRange : " + range.start + " - " + range.end);
			return range;		 
		},
	
		/**
		 * Returns current caret position
		 * @return {Number|null}
		 */
		getCaretPos: function(){
			var pos = this.document.TextToAbsolute(this.view.Position);
	 		this.trace("getCaretPos : " + pos);
			return pos;
		},
	
		/**
		 * Set new caret position
		 * @param {Number} pos Caret position
		 */
		setCaretPos: function(pos){		
	 		this.trace("setCaretPos : " + pos);
			this.view.Position = this.document.AbsoluteToText(pos);
		},
	
		/**
		 * Returns content of current line
		 * @return {String}
		 */
		getCurrentLine: function(){
			var start = new Position(this.view.Position.Line, 0);
			var end   = new Position(this.view.Position.Line, this.document.GetLineLength(this.view.Position.Line));
			var text = this.document.GetText(CreateRange(start, end)); 
	 		this.trace("getCurrentLine : " + text);
			return text;
		},
	
		/**
		 * Replace editor's content or it's part (from <code>start</code> to 
		 * <code>end</code> index). If <code>value</code> contains 
		 * <code>caret_placeholder</code>, the editor will put caret into 
		 * this position. If you skip <code>start</code> and <code>end</code>
		 * arguments, the whole target's content will be replaced with 
		 * <code>value</code>. 
		 * 
		 * If you pass <code>start</code> argument only,
		 * the <code>value</code> will be placed at <code>start</code> string 
		 * index of current content. 
		 * 
		 * If you pass <code>start</code> and <code>end</code> arguments,
		 * the corresponding substring of current target's content will be 
		 * replaced with <code>value</code>. 
		 * @param {String} value Content you want to paste
		 * @param {Number} [start] Start index of editor's content
		 * @param {Number} [end] End index of editor's content
		 * @param {Boolean} [no_indent] Do not auto indent <code>value</code>
		 */
		replaceContent: function(value, start, end, no_indent) {
			var content = this.getContent();
			var caret_pos = this.getCaretPos();
			var has_start = typeof(start) !== 'undefined';
			var has_end = typeof(end) !== 'undefined';

			if (!has_start && !has_end) {
				start = 0;
				end = content.length;
			} else if (!has_end) {
				end = start;
			}
		
			if ( typeof(no_indent) === 'undefined' )
				no_indent = false;

			var caret_placeholder = emmet.require('utils').getCaretPlaceholder(); // get '{%::zen-caret::%}', do not hardcode it!
			 
			// find new caret position
			var new_pos = value.indexOf(caret_placeholder);
			if (new_pos != -1) {			
				value = value.split(caret_placeholder).join(''); // remove placeholders from string
				value = value.substr(0, new_pos) + '%|%' + value.substr(new_pos, value.length - new_pos);  
			}

			var toReplace = CreateRange(this.document.AbsoluteToText(start), this.document.AbsoluteToText(end));
			this.view.InsertTemplate(toReplace, value, AddUndoActionType("Expand Emmet template"), no_indent);	
	 		this.trace("replaceContent : " + start + " - " + end + ", no_indent = " + no_indent + "; " + value);
		},
	
		/**
		 * Returns editor's content
		 * @return {String}
		 */
		getContent: function(){
			var text = this.document.GetText(); 
			this.trace("getContent : " + text.length);
			return text;
		},
	
		/**
		 * Returns current editor's syntax mode
		 * @return {String}
		 */
		getSyntax: function(){
			var style_range = this.document.GetStyleFromPos(this.view.Position);
	 		var syntax = style_range.Style.Syntax.ID.toLowerCase();
			if ( syntax == 'html5' ) syntax = 'html'; 
			if ( syntax == 'css_ms' ) syntax = 'css';
	 		this.trace("getSyntax : " + syntax);
			return syntax;
		},
	
		/**
		 * Returns current output profile name (@see zen_coding#setupProfile)
		 * @return {String}
		 */
		getProfileName: function() {
	 		this.trace("getProfileName : " + this.profile); 
			return this.profile;
		},
	
		/**
		 * Ask user to enter something
		 * @param {String} title Dialog title
		 * @return {String} Entered data
		 * @since 0.65
		 */
		prompt: function(title) {
	 		this.trace("prompt : " + title);
			return prompt(title);
		},
	
		/**
		 * Returns current selection
		 * @return {String}
		 * @since 0.65
		 */
		getSelection: function() {
			var selection = this.document.GetText(this.view.Selection);
	 		this.trace("getSelection : " + selection);
			return selection;
		},
	
		/**
		 * Returns current editor's file path
		 * @return {String}
		 * @since 0.65 
		 */
		getFilePath: function() {
			var path = this.document.Path;
			this.trace("getFilePath : " + path);
			return path;
		},

		/**
		 * Returns core Zen Coding object
		 */
		getCore: function() {
			return emmet;
		},

		/**
		 * Returns Zen Coding resource manager. You can add new snippets and
		 * abbreviations with this manager, as well as modify ones.<br><br>
		 *
		 * Zen Coding stores settings in two separate vocabularies: 'system'
		 * and 'user'. The ultimate solution to add new abbreviations and
		 * snippets is to setup a 'user' vocabulary, like this:
		 *
		 * @example
		 * var my_settings = {
		 * 	html: {
		 * 		abbreviations: {
		 * 			'tag': '<div class="mytag">'
		 * 		}
		 * 	}
		 * };
		 * zen_editor.getResourceManager().setVocabulary(my_settings, 'user')
		 *
		 * @see zen_resources.js
		 */
		getResourceManager: function() {
			return emmet.require('resources');
		}
};