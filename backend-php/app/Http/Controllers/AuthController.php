<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

// ✅ use the fork's facade (replace any Tymon\... import)
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
// (optional, for nicer error handling)
// use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller {
    public function register(Request $r){
        $data = $this->validate($r,[
            'name'=>'required',
            'email'=>'required|email|unique:users',
            'password'=>'required|min:6'
        ]);
        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);
        return response()->json($user,201);
    }

    public function login(request $r) {
        $creds = $this->validate($r, [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // Use the jwt guard via Auth manager
        if (! $token = Auth::guard('api')->attempt($creds)) {
            return response()->json(['error' => 'invalid_credentials'], 401);
        }

        return response()->json(['token' => $token]);
    }
}
