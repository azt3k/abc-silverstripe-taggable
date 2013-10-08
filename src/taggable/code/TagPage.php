<?php
class TagPage extends Page {

	private static $allowed_children = 'none';

	public static $icon = 'taggable/images/icons/tags-page';	

	public function getCMSFields() {
	
		$fields = parent::getCMSFields();
		$fields->removeFieldFromTab( 'Root.Content.Main', 'Content' );
		
		return $fields;
	}

}

class TagPage_Controller extends Page_Controller {

	/**
	 * An array of actions that can be accessed via a request. Each array element should be an action name, and the
	 * permissions or conditions required to allow the user to access it.
	 *
	 * <code>
	 * array (
	 *     'action', // anyone can access this action
	 *     'action' => true, // same as above
	 *     'action' => 'ADMIN', // you must have ADMIN permissions to access this action
	 *     'action' => '->checkAction' // you can only access this action if $this->checkAction() returns true
	 * );
	 * </code>
	 *
	 * @var array
	 */
	public static $allowed_actions = array (
		'tag'
	);

	public function init() {
		parent::init();
	}


	/*
	 * tag Action 
	 */
	public function tag(){

		$this->TagStr = $tag = Director::urlParam('ID');

		// page limits
		$paginator = new AbcPaginator(Taggable::$default_num_page_items);
		$dataSet = Taggable::getTaggedWith($tag, null, $paginator->start, $paginator->limit);

		$this->TagSet = $dataSet;
		
		// Supply template with pagination data
		$this->Paginator = $paginator->dataForTemplate($dataSet->unlimitedRowCount, 2);

		return array();

	}

}