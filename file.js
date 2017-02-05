/**
 * Implementation of @{link IEmmetFile} interface
 * See `javascript/interfaces/IEmmetFile.js`
 * @param {Function} require
 * @param {Underscore} _
  * @constructor
 */
 
 // function to convert VB array to JavaScript array
 function ax2js(axArray) {    
	 return new VBArray(axArray).toArray();
 }

emmet.define('file', function(require, _) {
	return {
		/**
		 * Read file content and return it
		 * @param {String} path File's relative or absolute path
		 * @return {String}
		 */
		read: function(path) {
			editorProxy.trace("zen_file.read : " + path);
			var data = ax2js(read_file(path, true));
			var content = [];
			for (i = 0; i < data.length; i++)
				content.push(String.fromCharCode(data[i]));
			return content.join('');
		},
	
		/**
		 * Locate <code>file_name</code> file that relates to <code>editor_file</code>.
		 * File name may be absolute or relative path
		 * 
		 * <b>Dealing with absolute path.</b>
		 * Many modern editors have a "project" support as information unit, but you
		 * should not rely on project path to find file with absolute path. First,
		 * it requires user to create a project before using this method (and this 
		 * is not actually Zen). Second, project path doesn't always points to
		 * to website's document root folder: it may point, for example, to an 
		 * upper folder which contains server-side scripts.
		 * 
		 * For better result, you should use the following algorithm in locating
		 * absolute resources:
		 * 1) Get parent folder for <code>editor_file</code> as a start point
		 * 2) Append required <code>file_name</code> to start point and test if
		 * file exists
		 * 3) If it doesn't exists, move start point one level up (to parent folder)
		 * and repeat step 2.
		 * 
		 * @param {String} editor_file
		 * @param {String} file_name
		 * @return {String|null} Returns null if <code>file_name</code> cannot be located
		 */
		locateFile: function(editor_file, file_name) {
			editorProxy.trace("zen_file.locateFile : " + editor_file + " - " + file_name);
			return ResolveFileName(editor_file, file_name, true);
		},
	
		/**
		 * Creates absolute path by concatenating <code>parent</code> and <code>file_name</code>.
		 * If <code>parent</code> points to file, its parent directory is used
		 * @param {String} parent
		 * @param {String} file_name
		 * @return {String}
		 */
		createPath: function(parent, file_name) {
			editorProxy.trace("zen_file.createPath : " + parent + " - " + file_name);
			return ResolveFileName(parent, file_name, false);
		},
	
		/**
		 * Saves <code>content</code> as <code>file</code>
		 * @param {String} file File's absolute path
		 * @param {String} content File content
		 */
		save: function(file, content) {
			editorProxy.trace("zen_file.save : " + file);
			save_file(file, content, true);
		},
	
		/**
		 * Returns file extension in lower case
		 * @param {String} file
		 * @return {String}
		 */
		getExt: function(file) {
			var m = (file || '').match(/\.([\w\-]+)$/);
			return m ? m[1].toLowerCase() : '';
		}
	}
});