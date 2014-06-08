//
//  EmailSenderPlugin.m
//
//  Created by Chunyang Wang on 6/13/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "EmailSenderPlugin.h"

@implementation EmailSenderPlugin
@synthesize callbackID;
- (void) send:(CDVInvokedUrlCommand *)command {
    
    NSString* TAG = @"EmailSenderPlugin.send() -";
    NSLog(@"%@ Entry", TAG);
    
    self.callbackID = command.callbackId;
    
    NSString *toRecipientsString = [command.arguments objectAtIndex:0];
    NSString *subject = [command.arguments objectAtIndex:1];
    NSString *body = [command.arguments objectAtIndex: 2];
    
    MFMailComposeViewController *composer = [[MFMailComposeViewController alloc] init];
    composer.mailComposeDelegate = self;
    
    // set subject
    if(subject!=nil){
        [composer setSubject:subject];    
    }
    
    // set body
    if(body!=nil){
        [composer setMessageBody:body isHTML:NO];
    }
    
    // set recipients
    if(toRecipientsString!=nil){
        [composer setToRecipients:[toRecipientsString componentsSeparatedByString:@","]];
    }
    
    if(composer!=nil){
        [self.viewController presentModalViewController:composer animated:YES];
    }
}

// Dismisses the email composition interface when users tap Cancel or Send. 
// Proceeds to update the message field with the result of the operation.

- (void) mailComposeController:(MFMailComposeViewController*)controller didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error {
    NSString *TAG = @"EmailSenderPlugin.mailComposeController -";
    NSLog(@"%@ Entry", TAG);
    // Notifies users about errors associated with the interface
    int webviewResult = 0;
    
    switch (result) {
        case MFMailComposeResultSent:
            webviewResult = 0;
            NSLog(@"%@ Sent", TAG);
            break;
        case MFMailComposeResultSaved:
            webviewResult = 1;
            NSLog(@"%@ Saved", TAG);
            break;
        case MFMailComposeResultFailed:
            webviewResult = 2;
            NSLog(@"%@ Failed", TAG);
            break;
        case MFMailComposeResultCancelled:
            webviewResult = 3;
            NSLog(@"%@ Cancelled", TAG);            
            break;
        default:
            NSLog(@"%@ Unkown error", TAG);
            webviewResult = 4;
            break;
    }
    
    [self.viewController dismissModalViewControllerAnimated:YES];
    
    // Create Plugin Result
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:[NSString stringWithFormat:@"%d", webviewResult]];

    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackID];
}
@end
