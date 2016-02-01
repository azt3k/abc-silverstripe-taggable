<?php

class TagField extends TextField {

	public function __construct($name, $title = null, $value = '', $maxLength = null, $form = null) {

		parent::__construct($name, $title, $value, $maxLength, $form);

		Requirements::javascript(TAGGABLE_DIR . '/assets/build/js/lib.js');
		Requirements::javascript(TAGGABLE_DIR . '/assets/build/js/tagfield.js');
		Requirements::customScript(file_get_contents($_SERVER['DOCUMENT_ROOT'].'/'.ABC_PATH.'/javascript/ColourPickerField.js'));
		Requirements::css(ABC_VENDOR_PATH . '/jquery.colorpicker/jquery.colorpicker.css');
        Requirements::css(ABC_PATH . '/css/ColourPickerField.css');

		$this->addExtraClass('text');
	}
}
