<?php

class TagAdmin extends ModelAdmin {

    /**
     * [$managed_models description]
     * @var array
     */
    private static $managed_models = array(
        'Tag',
    );

    /**
     * [$url_segment description]
     * @var string
     */
    private static $url_segment = 'Tags';

    /**
     * [$menu_title description]
     * @var string
     */
    private static $menu_title = 'Tags';
}
