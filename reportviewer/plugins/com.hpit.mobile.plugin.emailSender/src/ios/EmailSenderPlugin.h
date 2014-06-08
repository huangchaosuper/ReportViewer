//
//  EmailSenderPlugin.h

//
//  Created by Chunyang Wang on 6/13/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import <Foundation/Foundation.h>
#import <MessageUI/MFMailComposeViewController.h>
#import <Cordova/CDVPlugin.h>

@interface EmailSenderPlugin : CDVPlugin <MFMailComposeViewControllerDelegate> {
    NSString* callbackID;
}

@property (nonatomic, copy) NSString* callbackID;

- (void) send:(CDVInvokedUrlCommand *)command;

@end
