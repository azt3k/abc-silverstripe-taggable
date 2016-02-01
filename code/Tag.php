<?php

class Tag extends DataObject {

    private static $db = array(
        'Title' => 'Varchar(255)',
    );

    private static $indexes = array(
        'Title'
    );
}
