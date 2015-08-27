.class Lcom/chetbox/twitter/android/TweetListActivity$1;
.super Ljava/lang/Object;
.source "TweetListActivity.java"

# interfaces
.implements Landroid/view/View$OnClickListener;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/chetbox/twitter/android/TweetListActivity;->onCreate(Landroid/os/Bundle;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lcom/chetbox/twitter/android/TweetListActivity;


# direct methods
.method constructor <init>(Lcom/chetbox/twitter/android/TweetListActivity;)V
    .registers 2

    .prologue
    .line 49
    iput-object p1, p0, Lcom/chetbox/twitter/android/TweetListActivity$1;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public onClick(Landroid/view/View;)V
    .registers 5
    .param p1, "v"    # Landroid/view/View;

    .prologue
    .line 52
    new-instance v0, Landroid/content/Intent;

    iget-object v1, p0, Lcom/chetbox/twitter/android/TweetListActivity$1;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    const-class v2, Lcom/chetbox/twitter/android/ComposeTweetActivity;

    invoke-direct {v0, v1, v2}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    .line 53
    .local v0, "composeIntent":Landroid/content/Intent;
    iget-object v1, p0, Lcom/chetbox/twitter/android/TweetListActivity$1;->this$0:Lcom/chetbox/twitter/android/TweetListActivity;

    const/16 v2, 0xa

    invoke-virtual {v1, v0, v2}, Lcom/chetbox/twitter/android/TweetListActivity;->startActivityForResult(Landroid/content/Intent;I)V

    .line 54
    return-void
.end method
