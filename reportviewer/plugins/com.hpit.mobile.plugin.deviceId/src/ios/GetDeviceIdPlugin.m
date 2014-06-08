//
//  GetDeviceIdPlugin.m
//  app-catalog-ios-hybrid
//
//  Created by Ma Huixin on 6/21/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "GetDeviceIdPlugin.h"
#import "KeychainRepository.h"

static NSString *const LOGIN_SERVICE=@"com.hp.it.mobile.login";

@implementation GetDeviceIdPlugin
@synthesize keychainAccessGroup;
- (id) initWithWebView:(UIWebView*)theWebView
{
    self = [super initWithWebView:theWebView];
    
    NSString* TAG = @"GetDeviceIdPlugin.initWithWebView() - ";
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
    NSString* TAG = @"GetDeviceIdPlugin.get() -";
    NSLog(@"%@ Entry", TAG);
    
    // Get the key that javascript sent us
    NSString* key = @"DeviceId";
    NSLog (@"%@ The key is %@", TAG, key);
    
    // Get the value from Keychain
    KeychainRepository * keychain = [KeychainRepository keychainRepositoryWithService:LOGIN_SERVICE accessGroup:self.keychainAccessGroup];
    NSString* value = [keychain stringForKey:key];
    
    NSLog (@"%@ The value is %@", TAG, value);
    
    // Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:value];
    
    
    
    // Check if the value found from Keychain
    if([value length] == 0){
        NSString *appBundleIdentifier = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleIdentifier"];
        NSLog(@"%@ The bundle identifier is %@", TAG, appBundleIdentifier);
        if([@"com.hpit.mobile.appcatalog" isEqualToString:appBundleIdentifier]){
            NSString* bundlePath = [[[NSBundle mainBundle] bundlePath] stringByDeletingLastPathComponent];
            NSString* uniqueAppInstanceIdentifier= [bundlePath lastPathComponent];
            NSLog(@"%@ the uniqueAppInstanceIdentifier = %@", TAG,uniqueAppInstanceIdentifier);
            //save key and value to Keychain
            KeychainRepository *keychain = [KeychainRepository keychainRepositoryWithService:LOGIN_SERVICE accessGroup:self.keychainAccessGroup];
            [keychain setString:uniqueAppInstanceIdentifier forKey:key];
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:uniqueAppInstanceIdentifier];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            NSLog(@"%@ device id is stored successfully.", TAG);
        }else {
            NSLog(@"%@ You have no access to put %@", TAG, key);
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"DEVICEID_NOT_FOUND"];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    } else {
        NSLog(@"%@ Call the javascript success function", TAG);
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    NSLog (@"%@ Exit", TAG);
}
@end
