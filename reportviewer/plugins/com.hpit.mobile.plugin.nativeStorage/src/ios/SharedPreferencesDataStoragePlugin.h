//
//  SharedPreferencesDataStoragePlugin.h
//  hplogin-test-ios-enyo
//
//  Created by Chunyang Wang on 6/6/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface SharedPreferencesDataStoragePlugin : CDVPlugin {
    NSString *keychainAccessGroup;
}

@property (nonatomic, copy) NSString *keychainAccessGroup;
// Instance methods
- (void) get:(CDVInvokedUrlCommand *)command;
- (void) put:(CDVInvokedUrlCommand *)command;
@end
