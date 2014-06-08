//
//  KeychainRepository.h
//  hplogin-test-ios-enyo
//
//  Created by Chunyang Wang on 6/11/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface KeychainRepository : NSObject {
    NSString *service;
    NSString *accessGroup;
    NSMutableDictionary *itemsToUpdate;
}

@property (nonatomic, readonly) NSString *service;
@property (nonatomic, readonly) NSString *accessGroup;

+ (KeychainRepository *)keychainRepositoryWithService:(NSString *)service accessGroup:(NSString *)accessGroup; 
- (id)initWithService:(NSString *)service accessGroup:(NSString *)accessGroup;

- (void)setString:(NSString *)value forKey:(NSString *)key;
- (NSString *)stringForKey:(NSString *)key;

- (void)removeItemForKey:(NSString *)key;

- (void)synchronize;

@end
