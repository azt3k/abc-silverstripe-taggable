<?php

class Taggable extends DataExtension {

	public static $default_num_page_items 	= 10;	
	protected static $tags_page_link		= null;

	private $db = array(
		'Tags' => 'Text'
	}

	/*
	These fields do not display in model admin
	also where is updateCMSFields_forPopup
	*/
	public function updateCMSFields($fields) {

		if(get_class($fields->fieldByName('Root.Content')) == 'TabSet'){

			$fields->addFieldsToTab('Root.Content.Metadata', $this->getTagFields());

		}elseif(get_class($fields->fieldByName('Root')) == 'TabSet'){

			$fields->addFieldsToTab('Root.Metadata', $this->getTagFields());

		}elseif(get_class($fields) == 'FieldSet'){
			foreach($this->getTagFields() as $f){
				$fields->push($f);
			}
		}
		
	}

	public function getIncludeInDump(){
		$includeInDump = method_exists($this->owner, 'getIncludeInDump') ? $this->owner->getIncludeInDump() : array();
		$includeInDump = (  !empty($includeInDump) && is_array($includeInDump) ) ? $includeInDump : array() ;
		$includeInDump[] = 'TagURLStr';
		$includeInDump = array_unique($includeInDump);
		return $includeInDump;
	}

	/**
	 * @return array
	 */
	protected function getTagFields() {

		$fields = array(
			new TextField('Tags', 'Tags (comma separated)')
		);

		return $fields;
	}
	
	// need to get these to work properly
	public function getExplodedTags(){
		return explode(',', $this->owner->Tags);
	}

	public function setExplodedTags($tags){
		$this->owner->Tags = is_array($tags) ? implode(',', $tags) : $tags ;
	}

	public function getTagURLStr(){
		return $this->owner->Tags
			? self::tags2Links($this->owner->Tags)
			: null ;
	}	
	
	/*
	 *	because this is a data set of mixed classes we need to manually create a db query
	 */
	public static function getTaggedWith($tag, $filterSql=null, $start = 0, $limit = 40){

		// Set some vars
		$classes 	= DataObjectHelper::getExtendedClasses('Taggable');
		$set 		= new DataObjectSet;
		$db 		= AddDB::getInstance();
		$sql 		= '';
		$tables = $joins = $filter = array();

		// Build Query Data
		foreach($classes as $className){
			
			// Fetch Class Data
			$table 		= DataObjectHelper::getTableForClass($className);
			$extTable 	= DataObjectHelper::getExtensionTableForClassWithProperty($className,'Tags');
			
			// $tables we are working with
			if ($table) $tables[$table] = $table;
			
			// join
			if( $table && $extTable && $table!=$extTable ){
				$joins[$table][] = $extTable;
			}elseif($extTable){
				$tables[$extTable] = $extTable;
			}

			// Where
			if ($table) $where[$table][] = $table.".ClassName = '".$className."'";
			
			// Tag filter
			// Should be REGEX so we don't get partial matches
			if ($extTable) $filter[$table][] = $extTable.".Tags REGEXP '(^|,| )+".Convert::raw2sql($tag)."($|,| )+'";	

		}


		// Build Query
		foreach($tables as $table){

			if (array_key_exists($table, $joins)){

				// Prepare Where Statement
				$uWhere 	= array_unique($where[$table]);
				$uFilter 	= array_unique($filter[$table]);
				$wSql 		= "(".implode(' OR ',$uWhere).") AND (".implode(' OR ',$uFilter).")";

				// Make the rest of the SQL
				if ($sql) $sql.= "UNION ALL"."\n\n";
				$rowCountSQL = !$sql ? "SQL_CALC_FOUND_ROWS " : "" ;
				$sql.= "SELECT ".$rowCountSQL.$table.".ClassName, ".$table.".ID"."\n";
				$sql.= "FROM ".$table."\n";

				// join
				$join = array_unique($joins[$table]);
				foreach($join as $j){
					$sql.= " LEFT JOIN ".$j." ON ".$table.".ID = ".$j.".ID"."\n";
				}

				// Add the WHERE statement
				$sql.= "WHERE ".$wSql."\n\n";
			}
		}

		// Add Global Filter to Query
		if ($filterSql) $sql.="WHERE ".$filterSql;		

		// Add Limits to Query
		$sql.="LIMIT ".$start.",".$limit;

		// Get Data
		$result = $db->query($sql);
		$result = $result ? $result->fetchAll(PDO::FETCH_OBJ) : array() ;

		// Convert to DOs
		foreach( $result as $entry ){

			// Make the data easier to work with
			$entry 		= (object) $entry;
			$className 	= $entry->ClassName;

			// this is faster but might not pull in relations
			//$dO = new $className;
			//$dO = DataObjectHelper::populate($dO, $entry);

			// this is slower, but will be more reliable
			$dO = DataObject::get_by_id($className, $entry->ID);

			$set->push($dO);
		}
		$set->unlimitedRowCount = $db->query('SELECT FOUND_ROWS() AS total')->fetch(PDO::FETCH_OBJ)->total;
		return $set;

	}

	// attach specific urls to tags for rendering
	
	public static function tags2Links($strTags){

		// find the url of the tags page
		if (!$tagsPageURL=self::getTagPageLink()) throw new Exception('There is no page of type TagsPage in the site tree');

		$outputTags = explode(',',$strTags);
		$tempTags = array();

		foreach($outputTags as $oTags){
			array_push($tempTags, "<a href='".$tagsPageURL."tag/".trim($oTags)."'>".trim($oTags)."</a>");
		}

		return implode(', ', $tempTags);
	}

	public static function getTagPageLink(){
		if (!self::$tags_page_link){
			if (!$tagsPage = DataObject::get_one('TagPage')) return false ;
			self::$tags_page_link = $tagsPage->Link();
		}
		return self::$tags_page_link;
	}

	public function getAssociatedLink(){
		if (method_exists($this->owner, 'Link')) return $this->owner->Link();
		return false;
	}

	public function getAssociatedImage(){
		if (method_exists($this->owner, 'getAssociatedImage')) return $this->owner->getAssociatedImage();
		if (method_exists($this->owner, 'getAddImage')) return $this->owner->getAddImage();
		if (method_exists($this->owner, 'Image')) return $this->owner->Image();
		return false;
	}

	// onBeforeWrite
	// ----------------------------------------------------------------------------

	public function onBeforeWrite()
	{
		// call the parent onBeforeWrite
		parent::onBeforeWrite();

		// add some tags if there are none
		if (!$this->owner->Tags) {
			if (!empty($this->owner->MetaKeywords)) {
				$this->owner->Tags = $this->owner->MetaKeywords;
			} else {
				$exclude = array(
					'of','a','the','and','an','or','nor',
					'but','is','if','then','else','when',
					'at','from','by','on','off','for',
					'in','out','over','to','into','with',
					'also','back','well','big','when','where',
					'why','who','which', 'it', 'be', 'so', 'far',
					'one', 'our', 'we','only','they'
				);
				$titlePieces = explode(' ', strip_tags($this->owner->Title));
				$words = $parsed = array();
				if (!empty($this->owner->Title)) 	$words = array_merge( $words, $titlePieces, $titlePieces, $titlePieces); // sneakily increase title weighting
				if (!empty($this->owner->Content)) 	$words = array_merge( $words, explode(' ', strip_tags($this->owner->Content)));
				foreach($words as $word){
					$word = strtolower(trim(html_entity_decode(strval($word))));
					if ($word && !in_array(strtolower($word),$exclude) && substr($word,0,1) != '&' && strlen($word) > 3) $parsed[$word] = !empty($parsed[$word]) ? ($parsed[$word] + 1) : 1 ;
				}
				arsort($parsed);
				$sample = array_keys(array_slice($parsed,0, 10));
				// check again
				$dChecked = array();
				foreach ($sample as $value) {
					$value = strval($value);
					if (!empty($value) && strlen($value) > 3 ) $dChecked[] = $value;
				}
				$tags = implode(', ',$dChecked);
				$this->owner->Tags = $tags;
			}
		}

		// add meta keywords if there are none
		if (!$this->owner->MetaKeywords) {
			if ($this->owner->Tags) $this->owner->MetaKeywords = $this->owner->Tags;
		}

		// lowercase
		$this->owner->Tags = strtolower($this->owner->Tags);
	}

}