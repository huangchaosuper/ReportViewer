//
//  GetAppInfoPlugin.m
//  hplogin-test-ios-enyo
//
//  Created by Wang Chunyang on 9/12/12.
//
//

#import "GetAppInfoPlugin.h"

@implementation GetAppInfoPlugin

- (void)get:(CDVInvokedUrlCommand *)command
{
    NSString* TAG = @"GetAppInfoPlugin.get() -";
    NSLog(@"%@ Entry", TAG);
    
    CDVPluginResult* pluginResult = nil;
    
    @try {
        NSString* appBundleIdentifier = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleIdentifier"];
        NSLog(@"%@ The bundle identifier is %@", TAG, appBundleIdentifier);

        NSString* appVersionNumber=[[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"];
        NSLog(@"%@ The version number is %@", TAG, appVersionNumber);
        
        NSString* otpInstalled = @"NO";
        NSURL* optOpenurl = [NSURL URLWithString:@"otp://"];
        if ([[UIApplication sharedApplication] canOpenURL:optOpenurl]) {
            otpInstalled = @"YES";
        }
        
        NSString* appInfo=[NSString stringWithFormat:@"{\"appId\":\"%@\", \"versionNumber\":\"%@\",\"otpInstalled\":\"%@\"}", appBundleIdentifier, appVersionNumber,otpInstalled];
        
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:appInfo];
        
    }
    @catch (NSException *exception) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_JSON_EXCEPTION messageAsString:[exception reason]];
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}
@end
