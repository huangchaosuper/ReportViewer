//
//  OpenBrowserWithCookiePlugin.h
//  app-catalog-ios-hybrid
//
//  Created by Ma Huixin on 6/25/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface OpenBrowserWithCookiePlugin : CDVPlugin

// Instance methods
- (void) open:(CDVInvokedUrlCommand *)command;

@end
