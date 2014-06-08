//
//  SharedPreferencesDataStoragePlugin.m
//  hplogin-test-ios-enyo
//
//  Created by Chunyang Wang on 6/6/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "SharedPreferencesDataStoragePlugin.h"
#import "KeychainRepository.h"
static NSString *const LOGIN_SERVICE=@"com.hp.it.mobile.login";

@implementation SharedPreferencesDataStoragePlugin
@synthesize keychainAccessGroup;
- (id) initWithWebView:(UIWebView*)theWebView
{
    self = [super initWithWebView:theWebView];
    
    NSString* TAG = @"SharedPreferencesDataStoragePlugin.initWithWebView() - ";
    NSLog(@"%@Entry", TAG);
    if (self) {
        NSString *ssoKeychainConfigFile = [[NSBundle mainBundle] pathForResource:@"sso-keychain" ofType:@"plist"];
        NSLog(@"%@ssoKeychainConfigFile=%@", TAG, ssoKeychainConfigFile);
        
        NSDictionary *ssoKeychainDictionary = [NSDictionary dictionaryWithContentsOfFile:ssoKeychainConfigFile];
        
        if(!ssoKeychainDictionary){
            NSLog(@"%@Error reading plist %@", TAG, ssoKeychainConfigFile);
        } else {
            self.keychainAccessGroup = [ssoKeychainDictionary objectForKey:@"KeychainAccessGroup"];
            NSLog(@"%@keychainAccessGroup=%@", TAG, self.keychainAccessGroup);
        }
    }
    return self;
}
- (void) get:(CDVInvokedUrlCommand *)command {
    NSString* TAG = @"SharedPreferencesDataStoragePlugin.get() -";
    NSLog(@"%@ Entry", TAG);
    NSLog(@"%@ keychainAccessGroup=%@", TAG, self.keychainAccessGroup);

    
    // Get the key that javascript sent us
    NSString* key = [command.arguments objectAtIndex:0];
    NSLog (@"%@ The key is %@", TAG, key);
    
    // Get the value from Keychain
    KeychainRepository * keychain = [KeychainRepository keychainRepositoryWithService:LOGIN_SERVICE accessGroup:self.keychainAccessGroup];
    NSString* value = [keychain stringForKey:key];
    if([value length] ==0){
        NSLog(@"%@ The length of value is 0. No item of %@ is found", TAG, key);
    } else {
        NSLog (@"%@ The value is found. The length of value is %d", TAG, [value length]);
    }
    
    // Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:value];
    
    // Check if the value found from Keychain
    if([value length] == 0){
        NSLog(@"%@ Call the javascript error function", TAG);
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } else {
        NSLog(@"%@ Call the javascript success function", TAG);
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    NSLog (@"%@ Exit", TAG);
}

- (void) put:(CDVInvokedUrlCommand *)command {
    NSString* TAG = @"SharedPreferencesDataStoragePlugin.put() -";
    NSLog (@"%@ Entry", TAG);
    // The first argument in the arguments parameter is the callbackID.
    // We use this to send data back to the successCallback or failureCallback through PluginResult
    
    // Get the key that javascript sent us
    NSString* key = [command.arguments objectAtIndex:0];
    NSLog (@"%@ The key is %@", TAG, key);
    
    // Get the value that javascript sent us
    NSString* value = [command.arguments objectAtIndex:1];
    NSLog (@"%@ The value is found. The length of value is %d", TAG, [value length]);
    
    //save key and value to Keychain
    KeychainRepository *keychain = [KeychainRepository keychainRepositoryWithService:LOGIN_SERVICE accessGroup:self.keychainAccessGroup];
    [keychain setString:value forKey:key];
    
    //Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    
    NSLog(@"%@ Call the javascript success function", TAG);
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    
    //TODO: when to call js error function?
    NSLog (@"%@ Exit", TAG);
}
@end
