//
//  KeychainRepository.m
//  hplogin-test-ios-enyo
//
//  Created by Chunyang Wang on 6/11/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "KeychainRepository.h"

@implementation KeychainRepository

@synthesize service;
@synthesize accessGroup;

#pragma mark -

+ (KeychainRepository *)keychainRepositoryWithService:(NSString *)service accessGroup:(NSString *)accessGroup {
    return [[KeychainRepository alloc] initWithService:service accessGroup:accessGroup];
}
- (id)initWithService:(NSString *)inService accessGroup:(NSString *)inAccessGroup {
    self = [super init];
    if(self){
        service = [inService copy];
        accessGroup = [inAccessGroup copy];
        
        
#if !TARGET_IPHONE_SIMULATOR
        if(accessGroup){
            [itemsToUpdate setObject:accessGroup forKey:(__bridge id)(kSecAttrAccessGroup)];
        }
#endif        
        
        NSMutableDictionary *query = [NSMutableDictionary dictionaryWithDictionary:itemsToUpdate];
        [query setObject:(__bridge id)kSecMatchLimitAll forKey:(__bridge id)kSecMatchLimit];
        [query setObject:(id)kCFBooleanTrue forKey:(__bridge id)kSecReturnAttributes];
        
        CFMutableDictionaryRef result = NULL;
        OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef) query, (CFTypeRef *)&result);
        if(status == errSecSuccess){
            itemsToUpdate = [[NSMutableDictionary alloc] initWithDictionary:(__bridge NSDictionary *)(result)];
        } else {
            itemsToUpdate = [[NSMutableDictionary alloc] init];
        }
    }
    return self;
}

#pragma mark -

- (void)setString:(NSString *)value forKey:(NSString *)key {
    NSString* TAG = @"KeychainRepository.setString -";
    
    if(!key){
        NSAssert(NO, @"key must not be nil.");
        return;
    }
    
    //check if key is already in Keychain.
    NSMutableDictionary *query = [NSMutableDictionary dictionary];
    [query setObject:(__bridge id)(kSecClassGenericPassword) forKey:(__bridge id)(kSecClass)];
    [query setObject:service forKey:(__bridge id)kSecAttrService];
    [query setObject:key forKey:(__bridge id)kSecAttrGeneric];
    [query setObject:key forKey:(__bridge id)kSecAttrAccount];
    
#if !TARGET_IPHONE_SIMULATOR
    if(accessGroup){
        NSLog(@"%@ set access group %@", TAG, accessGroup);
        [query setObject:accessGroup forKey:(__bridge id)kSecAttrAccessGroup];
    }
#endif
    
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, NULL);
    if(status == errSecSuccess){
        if(value){
            NSData *data = [value dataUsingEncoding:NSUTF8StringEncoding];
            NSMutableDictionary *attributesToUpdate = [NSMutableDictionary dictionary];
            [attributesToUpdate setObject:data forKey:(__bridge id)kSecValueData];
            
            //key is found, update it
            status =  SecItemUpdate((__bridge CFDictionaryRef) query, (__bridge CFDictionaryRef) attributesToUpdate);
            if(status!=errSecSuccess){
                NSLog(@"%s|SecItemUpdate: error(%ld)", __func__, status);
            }
        } else {
            //no value is passed in, delete it
            [self removeItemForKey:key];
        }
    } else if(status == errSecItemNotFound){
        //key is not found, add new one
        NSMutableDictionary *attributes = [NSMutableDictionary dictionary];
        [attributes setObject:(__bridge id)kSecClassGenericPassword forKey:(__bridge id)kSecClass];
        [attributes setObject:service forKey:(__bridge id)kSecAttrService];
        [attributes setObject:key forKey:(__bridge id)kSecAttrGeneric];
        [attributes setObject:key forKey:(__bridge id)kSecAttrAccount];
        
        NSData * data = [value dataUsingEncoding:NSUTF8StringEncoding];
        [attributes setObject:data forKey:(__bridge id)kSecValueData];
#if !TARGET_IPHONE_SIMULATOR
        if(accessGroup){
            [attributes setObject:accessGroup forKey:(__bridge id)kSecAttrAccessGroup];
        }
#endif
        status = SecItemAdd((__bridge CFDictionaryRef) attributes, NULL);
        if(status !=errSecSuccess){
            NSLog(@"%s|SecItemAdd: error(%ld)", __func__, status);
        }
    } else {
        NSLog(@"%s|SecItemCopyMatching: error(%ld)",__func__, status);
    }
}

- (NSString *)stringForKey:(NSString *)key {
    NSString* TAG = @"KeychainRepository.stringForKey -";
    
    if(!key){
        NSAssert(NO, @"key must not be nil.");
        return nil;
    }
    NSMutableDictionary *query = [NSMutableDictionary dictionary];
    [query setObject:(__bridge id)(kSecClassGenericPassword) forKey:(__bridge id)kSecClass];
    [query setObject:(id)kCFBooleanTrue forKey:(__bridge id)kSecReturnData];
    [query setObject:(__bridge id)(kSecMatchLimitOne) forKey:(__bridge id)kSecMatchLimit];
    [query setObject:service forKey:(__bridge id)kSecAttrService];
    [query setObject:key forKey:(__bridge id)kSecAttrGeneric];
    [query setObject:key forKey:(__bridge id)kSecAttrAccount];
    
#if !TARGET_IPHONE_SIMULATOR
    if(accessGroup){
        NSLog(@"%@ set access group %@", TAG, accessGroup);
        [query setObject:accessGroup forKey:(__bridge id)kSecAttrAccessGroup];
    }
#endif
    CFDataRef data = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, (CFTypeRef *)&data);
 	if (status != errSecSuccess) {
		NSLog(@"%s|SecItemCopyMatching: error(%ld)", __func__, status);
	}
    if (data) {
        return [[NSString alloc] initWithData:(__bridge NSData *)(data) encoding:NSUTF8StringEncoding];
    } 
    
    return nil;
}

- (void)removeItemForKey:(NSString *)key {
    if (!key) {
        NSAssert(NO, @"key must not be nil.");
		return;
	}
    NSMutableDictionary *itemToDelete = [NSMutableDictionary dictionary];
	[itemToDelete setObject:(__bridge id)kSecClassGenericPassword forKey:(__bridge id)kSecClass];
	[itemToDelete setObject:service forKey:(__bridge id)kSecAttrService];
    [itemToDelete setObject:key forKey:(__bridge id)kSecAttrGeneric];
    [itemToDelete setObject:key forKey:(__bridge id)kSecAttrAccount];
#if !TARGET_IPHONE_SIMULATOR
    if (accessGroup) {
        [itemToDelete setObject:accessGroup forKey:(__bridge id)kSecAttrAccessGroup];
    }
#endif
    
	OSStatus status = SecItemDelete((__bridge CFDictionaryRef)itemToDelete);
	if (status != errSecSuccess && status != errSecItemNotFound) {
		NSLog(@"%s|SecItemDelete: error(%ld)", __func__, status);
	}
}
#pragma mark -

- (void)synchronize { 
    for (NSString *key in itemsToUpdate) {
        NSString *value = [[NSString alloc] initWithData:[itemsToUpdate objectForKey:key] encoding:NSUTF8StringEncoding];
        [self setString:value forKey:key];
    }
}
@end




