<?php
class TaggableTest extends SapphireTest
{

    public function testSetup()
    {
        // todo - write tests
    }

    /**
     * @depends testSetup
     */
    public function testSMTPMailerSetConf()
    {

        // phpunit is a bit broken so we manually call the dependent tests;
        $this->testSetup();
    }
}
