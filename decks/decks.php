<?php$files = scandir(".");$res = array();foreach ($files as $f)    if (! in_array($f, array('.', '..')))        $res[] = basename($f);echo implode("|", $res);