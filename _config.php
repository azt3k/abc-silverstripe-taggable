<?php

// Define path constant
$path = str_replace('\\', '/', __DIR__);
$path_fragments = explode('/', $path);
$dir_name = $path_fragments[count($path_fragments) - 1];
define('TAGGABLE_PATH', $dir_name . '/src/taggable');

Taggable::$default_num_page_items = 10;