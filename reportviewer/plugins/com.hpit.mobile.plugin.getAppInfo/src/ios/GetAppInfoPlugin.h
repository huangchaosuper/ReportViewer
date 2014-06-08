//
//  GetAppInfoPlugin.h
//  hplogin-test-ios-enyo
//
//  Created by Wang Chunyang on 9/12/12.
//
//

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface GetAppInfoPlugin : CDVPlugin

// Instance methods
- (void) get:(CDVInvokedUrlCommand *)command;
@end
