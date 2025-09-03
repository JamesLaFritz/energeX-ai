<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(){
        Schema::create('posts', function(Blueprint $t){
            $t->bigIncrements('id');
            $t->string('title');
            $t->text('content');
            $t->unsignedBigInteger('user_id');
            $t->timestamp('created_at')->useCurrent();
            $t->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $t->index(['user_id','created_at']);
        });
    }
    public function down(){ Schema::dropIfExists('posts'); }
};
