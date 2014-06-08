//
//  GetDeviceIdPlugin.h
//  app-catalog-ios-hybrid
//
//  Created by Ma Huixin on 6/21/12.
//  Copyright (c) 2012 HP. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Cordova/CDVPlugin.h>

@interface GetDeviceIdPlugin : CDVPlugin{
    NSString *keychainAccessGroup;
}
@property (nonatomic, copy) NSString* callbackID;
@property (nonatomic, copy) NSString *keychainAccessGroup;

// Instance methods
- (void) get:(CDVInvokedUrlCommand *)command;
@end
