//
//  OpenBrowserWithCookiePlugin.m
//  app-catalog-ios-hybrid
//
//  Created by Ma Huixin on 6/25/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "OpenBrowserWithCookiePlugin.h"

@implementation OpenBrowserWithCookiePlugin

- (void) open:(CDVInvokedUrlCommand *)command {
    NSString* TAG = @"OpenBrowserWithCookiePlugin.open() -";
    NSLog(@"%@ Entry", TAG);
    
    // Get the url and smsession that javascript sent us
    NSString* url = [command.arguments objectAtIndex:0];
    NSString* smsession = [command.arguments objectAtIndex:1];
    NSLog (@"%@ The url is %@", TAG, url);
    NSLog (@"%@ The smsession is %@", TAG, [smsession substringFromIndex:10]);


    BOOL res = [[UIApplication sharedApplication] openURL:[NSURL URLWithString:url]];
    
    // Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Yes"];
    
    // Check if the url open successful
    if(res){
        NSLog(@"%@ open url successful", TAG);
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } else {
        NSLog(@"%@ open url failed", TAG);
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"No"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
    NSLog (@"%@ Exit", TAG);
}

@end
