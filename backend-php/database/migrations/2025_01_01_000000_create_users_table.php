<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(){
        Schema::create('users', function(Blueprint $t){
            $t->bigIncrements('id');
            $t->string('name');
            $t->string('email')->unique();
            $t->string('password');
        });
    }
    public function down(){ Schema::dropIfExists('users'); }
};
